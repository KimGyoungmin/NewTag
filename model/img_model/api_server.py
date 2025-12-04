#!/usr/bin/env python3
"FastAPI server that exposes the image-to-listing pipeline."

from __future__ import annotations

import os
import tempfile
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

from process_images import (
    DEFAULT_MAX_DIMENSION,
    PipelineConfig,
    PipelineError,
    bootstrap_env,
    ensure_dir,
    process_image,
)
import requests

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent

# 환경 변수 확인 로그
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .env 파일 명시적으로 로드
from process_images import bootstrap_env
bootstrap_env()

# STATIC_ROOT 동적 계산: 환경 변수가 없으면 프로젝트 구조 기반으로 자동 설정
static_env = os.getenv("STATIC_ROOT")
if static_env:
    STATIC_ROOT = Path(static_env).resolve()
    logger.info(f"[Startup] STATIC_ROOT from env: {STATIC_ROOT}")
else:
    # Prefer external uploads dir for Docker/local dev, fall back to bundled static assets
    uploads_root = (PROJECT_ROOT / "uploads").resolve()
    if uploads_root.exists():
        STATIC_ROOT = uploads_root
        logger.info(f"[Startup] STATIC_ROOT defaulted to uploads: {STATIC_ROOT}")
    else:
        STATIC_ROOT = (PROJECT_ROOT / "BackEnd" / "src" / "main" / "resources" / "static").resolve()
        logger.info(f"[Startup] STATIC_ROOT auto-detected: {STATIC_ROOT}")

logger.info(f"[Startup] BASE_DIR: {BASE_DIR}")
logger.info(f"[Startup] PROJECT_ROOT: {PROJECT_ROOT}")
logger.info(f"[Startup] STATIC_ROOT final: {STATIC_ROOT}")

app = FastAPI(title="Image Listing Generator", version="1.0.0")

_PIPELINE_CONFIG: Optional[PipelineConfig] = None


class AutoListingRequest(BaseModel):
    image_paths: List[str] = Field(..., min_length=1, description="List of image paths")


class AutoListingResponse(BaseModel):
    title: Optional[str]
    content: Optional[str]
    priceKRW: Optional[int]
    category: Optional[str]
    source_image: str
    listing: Dict[str, Any]
    vision_attributes: Dict[str, Any]


def _build_config() -> PipelineConfig:
    bootstrap_env()
    output_dir = Path(os.getenv("OUTPUT_DIR", BASE_DIR / "output")).resolve()
    resized_dir = output_dir / "resized"
    upload_dir = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "upload")).resolve()

    ensure_dir(output_dir)
    ensure_dir(resized_dir)
    ensure_dir(upload_dir)

    vision_api_key = os.getenv("GOOGLE_VISION_KEY", "").strip()
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not vision_api_key or not gemini_api_key:
        raise RuntimeError(
            "Both GOOGLE_VISION_KEY and GEMINI_API_KEY must be configured before starting the server."
        )

    return PipelineConfig(
        base_dir=BASE_DIR,
        upload_dir=upload_dir,
        resized_dir=resized_dir,
        output_dir=output_dir,
        max_dimension=int(os.getenv("IMAGE_MAX_DIMENSION", DEFAULT_MAX_DIMENSION)),
        workers=1,
        vision_api_key=vision_api_key,
        gemini_api_key=gemini_api_key,
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        recursive=False,
    )


def _resolve_image_path(raw_path: str) -> Path:
    if not raw_path:
        raise ValueError("Empty image path provided.")

    parsed = urllib.parse.urlparse(raw_path)
    if parsed.scheme in {"http", "https"}:
        return _fetch_remote_image(raw_path, parsed)

    normalized = raw_path.strip().lstrip("/\\")
    candidate = Path(normalized)
    if not candidate.is_absolute():
        if normalized.startswith("static/"):
            candidate = PROJECT_ROOT / normalized
        else:
            candidate = STATIC_ROOT / normalized
    candidate = candidate.resolve()
    if not candidate.exists():
        raise FileNotFoundError(f"Image not found: {candidate}")
    return candidate


def _fetch_remote_image(raw_url: str, parsed: urllib.parse.ParseResult) -> Path:
    """Download a remote image to a temp file and return its path."""
    resp = requests.get(raw_url, timeout=10)
    resp.raise_for_status()
    suffix = Path(parsed.path).suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(resp.content)
        tmp_path = Path(tmp.name)
    logger.info(f"[AutoListing] Downloaded remote image to {tmp_path}")
    return tmp_path


@app.on_event("startup")
def _startup() -> None:
    global _PIPELINE_CONFIG  # pylint: disable=global-statement
    _PIPELINE_CONFIG = _build_config()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    import logging
    logger = logging.getLogger("uvicorn")

    if request.url.path == "/auto-listing":
        body = await request.body()
        logger.info(f"[Middleware] Raw request body: {body.decode('utf-8')}")
        logger.info(f"[Middleware] Content-Type: {request.headers.get('content-type')}")
        logger.info(f"[Middleware] Headers: {dict(request.headers)}")

        # Body를 다시 사용할 수 있도록 request를 재구성
        async def receive():
            return {"type": "http.request", "body": body}

        request._receive = receive

    response = await call_next(request)
    return response


@app.post("/auto-listing", response_model=AutoListingResponse)
async def auto_listing(payload: AutoListingRequest) -> AutoListingResponse:
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info(f"[AutoListing] Received payload: {payload}")
    logger.info(f"[AutoListing] Image paths: {payload.image_paths}")

    if not _PIPELINE_CONFIG:
        raise HTTPException(status_code=500, detail="Pipeline not initialized.")

    last_error: Optional[str] = None
    for raw_path in payload.image_paths:
        try:
            image_path = _resolve_image_path(raw_path)
        except (ValueError, FileNotFoundError) as exc:
            last_error = str(exc)
            continue

        try:
            result = process_image(image_path, _PIPELINE_CONFIG)
        except PipelineError as exc:
            last_error = str(exc)
            continue

        listing = result.get("listing", {})
        vision_attrs = result.get("vision_attributes", {})
        return AutoListingResponse(
            title=listing.get("title"),
            content=listing.get("content"),
            priceKRW=listing.get("priceKRW"),
            category=listing.get("category"),
            source_image=str(image_path),
            listing=listing,
            vision_attributes=vision_attrs,
        )

    raise HTTPException(status_code=422, detail=last_error or "모든 이미지 처리에 실패했습니다.")
