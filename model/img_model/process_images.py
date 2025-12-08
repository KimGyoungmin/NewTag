#!/usr/bin/env python3
"""
Pipeline for preparing marketplace listings from images.

Steps:
1. Resize source images to a bounded square using Pillow.
2. Send resized bytes to Google Vision for semantic attributes.
3. Forward the resized image + extracted metadata to Gemini to draft the listing.
4. Persist consolidated JSON artifacts to the configured output directory.
"""
from __future__ import annotations

import argparse
import base64
import json
import logging
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence

import requests
from PIL import Image, UnidentifiedImageError

LOGGER = logging.getLogger("img_model")

SUPPORTED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tiff")
DEFAULT_MAX_DIMENSION = 512
DEFAULT_MAX_RESULTS = 3
DEFAULT_TIMEOUT = 10
JPEG_QUALITY = 82
FORBIDDEN_FILES = [
    Path(__file__).resolve().parent / "forbidden_items.txt",
    Path(__file__).resolve().parent / "forbidden_items.json",
]

SESSION = requests.Session()
_FORBIDDEN_CACHE: Optional[List[str]] = None


class PipelineError(Exception):
    """Raised when an image cannot complete the processing pipeline."""


def normalize_env_value(value: str) -> str:
    value = value.strip()
    if not value:
        return value
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def load_env_file(path: Path) -> None:
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return
    for line in raw.splitlines():
        striped = line.strip()
        if not striped or striped.startswith("#") or "=" not in striped:
            continue
        key, value = striped.split("=", 1)
        key = key.strip()
        value = normalize_env_value(value)
        os.environ[key] = value
    LOGGER.debug("Loaded environment variables from %s", path)


def load_forbidden_items() -> List[str]:
    """Load forbidden item keywords (supports comma/pipe separated synonyms) and cache them."""
    global _FORBIDDEN_CACHE  # noqa: PLW0603
    if _FORBIDDEN_CACHE is not None:
        return _FORBIDDEN_CACHE

    items: List[str] = []

    def _extend(raw: str) -> None:
        # allow comma or pipe separated synonyms in a single line/entry
        for token in re.split(r"[|,]", raw):
            token = token.strip()
            if token:
                items.append(token)
    
    for path in FORBIDDEN_FILES:
        if not path.exists():
            continue
        try:
            if path.suffix.lower() == ".json":
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    for entry in data:
                        if isinstance(entry, str):
                            _extend(entry)
                continue

            for line in path.read_text(encoding="utf-8").splitlines():
                stripped = line.strip()
                if stripped and not stripped.startswith("#"):
                    _extend(stripped)
        except Exception as exc:  # pragma: no cover - defensive logging
            LOGGER.warning("Failed to load forbidden items from %s: %s", path, exc)

    _FORBIDDEN_CACHE = items
    return items


def detect_forbidden(attributes: Dict[str, Any]) -> Optional[str]:
    """Check vision attributes against forbidden keywords; return the matched keyword."""
    forbidden = load_forbidden_items()
    if not forbidden:
        return None

    texts: List[str] = []
    for entry in attributes.get("labels", []):
        if isinstance(entry, dict):
            val = (entry.get("description") or "").strip()
            if val:
                texts.append(val)
    for entry in attributes.get("logos", []):
        if isinstance(entry, dict):
            val = (entry.get("description") or "").strip()
            if val:
                texts.append(val)
    for entry in attributes.get("objects", []):
        if isinstance(entry, dict):
            val = (entry.get("name") or "").strip()
            if val:
                texts.append(val)

    detected_text = (attributes.get("detected_text") or "").strip()
    if detected_text:
        texts.append(detected_text)
    for entry in attributes.get("detected_text_variants", []):
        if isinstance(entry, str):
            val = entry.strip()
            if val:
                texts.append(val)

    haystack = "\n".join(texts).casefold()
    for word in forbidden:
        token = word.strip()
        if token and token.casefold() in haystack:
            return token
    return None


def detect_forbidden_text(texts: Sequence[str]) -> Optional[str]:
    """Check arbitrary text blobs for forbidden keywords."""
    forbidden = load_forbidden_items()
    if not forbidden:
        return None
    haystack = "\n".join((text or "") for text in texts).casefold()
    for word in forbidden:
        token = word.strip()
        if token and token.casefold() in haystack:
            return token
    return None


def build_forbidden_listing(keyword: str) -> Dict[str, Any]:
    return {
        "title": "금지 품목",
        "content": f"금지 품목({keyword})은 등록할 수 없습니다.",
        "priceKRW": 0,
        "category": "forbidden",
        "forbiddenItem": keyword,
    }


def bootstrap_env() -> None:
    """Load environment variables from likely locations if they exist."""
    script_dir = Path(__file__).resolve().parent
    candidates = [
        script_dir.parent / "NewTagModel" / ".env",
        script_dir.parent / ".env",
        script_dir / ".env",
    ]
    override = os.environ.get("IMG_MODEL_ENV_PATH")
    if override:
        candidates.append(Path(override))

    seen: set[Path] = set()
    for path in candidates:
        path = path.resolve()
        if path in seen or not path.exists():
            continue
        seen.add(path)
        load_env_file(path)


def resolve_dir(path_like: str, base_dir: Path) -> Path:
    path = Path(path_like)
    return path if path.is_absolute() else base_dir / path


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def display_relative_path(path: Path, base_dir: Path) -> str:
    """Return path as relative to base_dir when possible for cleaner logs/output."""
    try:
        return str(path.relative_to(base_dir))
    except ValueError:
        return str(path)


def list_images(upload_dir: Path, recursive: bool) -> List[Path]:
    if not upload_dir.exists():
        raise FileNotFoundError(f"Upload directory not found: {upload_dir}")

    files: Iterable[Path]
    if recursive:
        files = upload_dir.rglob("*")
    else:
        files = upload_dir.iterdir()

    result = [
        path
        for path in files
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not result:
        raise FileNotFoundError(f"No supported images in {upload_dir}")
    return sorted(result)


def resize_image(
    input_path: Path,
    output_dir: Path,
    max_dimension: int,
) -> Path:
    try:
        with Image.open(input_path) as img:
            img = img.convert("RGB")
            img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
            output_path = output_dir / input_path.name
            img.save(output_path, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            return output_path
    except UnidentifiedImageError as exc:
        raise PipelineError(f"Unsupported image format: {input_path}") from exc


def encode_image(path: Path) -> tuple[str, str]:
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".gif": "image/gif",
        ".tiff": "image/tiff",
    }
    suffix = path.suffix.lower()
    mime_type = mime_map.get(suffix, "image/jpeg")
    data = path.read_bytes()
    return mime_type, base64.b64encode(data).decode("utf-8")


def call_google_vision(
    image_b64: str,
    api_key: str,
    max_results: int = DEFAULT_MAX_RESULTS,
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    features = [
        {"type": "LABEL_DETECTION", "maxResults": max_results},
        {"type": "LOGO_DETECTION", "maxResults": max_results},
        {"type": "IMAGE_PROPERTIES", "maxResults": 1},
        {"type": "DOCUMENT_TEXT_DETECTION", "maxResults": max_results},
    ]
    payload = {
        "requests": [
            {
                "image": {"content": image_b64},
                "features": features,
            }
        ]
    }
    response = SESSION.post(url, json=payload, timeout=timeout)
    response.raise_for_status()
    body = response.json()
    return body["responses"][0]


def _simplify_vertices(poly: Dict[str, Any]) -> List[Dict[str, float]]:
    if not poly:
        return []
    verts = poly.get("normalizedVertices") or poly.get("vertices") or []
    simplified = []
    for vertex in verts[:4]:
        if not isinstance(vertex, dict):
            continue
        x = vertex.get("x")
        y = vertex.get("y")
        entry: Dict[str, float] = {}
        if x is not None:
            entry["x"] = round(float(x), 3)
        if y is not None:
            entry["y"] = round(float(y), 3)
        if entry:
            simplified.append(entry)
    return simplified


def summarize_vision_response(response: Dict[str, Any]) -> Dict[str, Any]:
    labels = [
        {"description": item.get("description"), "score": item.get("score")}
        for item in response.get("labelAnnotations", [])
    ]
    logos = [
        {
            "description": item.get("description"),
            "score": item.get("score"),
            "bounding_poly": _simplify_vertices(item.get("boundingPoly") or {}),
        }
        for item in response.get("logoAnnotations", [])
    ]
    objects = [
        {"name": item.get("name"), "score": item.get("score")}
        for item in response.get("localizedObjectAnnotations", [])
    ]
    colors = []
    dominant = (
        response.get("imagePropertiesAnnotation", {})
        .get("dominantColors", {})
        .get("colors", [])
    )
    for color in dominant:
        info = color.get("color", {})
        colors.append(
            {
                "hex": "#{:02x}{:02x}{:02x}".format(
                    int(info.get("red", 0)),
                    int(info.get("green", 0)),
                    int(info.get("blue", 0)),
                ),
                "score": color.get("score"),
                "pixelFraction": color.get("pixelFraction"),
            }
        )
    text_blocks: List[str] = []
    text_annotations = response.get("textAnnotations") or []
    if text_annotations:
        full_text = text_annotations[0].get("description", "").strip()
        if full_text:
            text_blocks.append(full_text)
        # Capture up to first 3 additional words/lines for more hints.
        for item in text_annotations[1:4]:
            desc = (item.get("description") or "").strip()
            if desc and desc not in text_blocks:
                text_blocks.append(desc)

    return {
        "labels": labels,
        "logos": logos,
        "objects": objects,
        "colors": colors,
        "detected_text": text_blocks[0] if text_blocks else "",
        "detected_text_variants": text_blocks,
    }


def build_attribute_prompt(attributes: Dict[str, Any]) -> str:
    labels = [
        entry.get("description")
        for entry in attributes.get("labels", [])
        if entry.get("description")
    ][:3]
    logos_raw = [
        entry
        for entry in attributes.get("logos", [])
        if entry.get("description")
    ][:3]
    logos = []
    for entry in logos_raw:
        desc = entry.get("description")
        score = entry.get("score")
        points = entry.get("bounding_poly") or []
        first_point = ""
        if points:
            pt = points[0]
            first_point = f" @{pt.get('x', '?')},{pt.get('y', '?')}"
        score_str = f"{score:.2f}" if isinstance(score, (int, float)) else "?"
        logos.append(f"{desc}({score_str}){first_point}")
    colors = [
        entry.get("hex")
        for entry in attributes.get("colors", [])
        if entry.get("hex")
    ][:2]
    detected_text = (attributes.get("detected_text") or "").strip()
    if len(detected_text) > 80:
        detected_text = detected_text[:77] + "..."

    segments: List[str] = []
    if labels:
        segments.append("라벨:" + ", ".join(labels))
    if logos:
        segments.append("로고:" + ", ".join(logos))
    if colors:
        segments.append("주요색상:" + ", ".join(colors))
    if detected_text:
        segments.append("문자:" + detected_text.replace("\n", " "))
    variants = attributes.get("detected_text_variants") or []
    if variants:
        snippets = []
        for item in variants[:3]:
            item = (item or "").strip()
            if item:
                snippets.append(item.replace("\n", " "))
        if snippets:
            segments.append("추가문자:" + " / ".join(snippets))

    return " | ".join(segments) if segments else "라벨/텍스트 단서 적음"


def call_gemini(
    model: str,
    api_key: str,
    attributes: Dict[str, Any],
    image_mime: str,
    image_b64: str,
    forbidden_words: Optional[List[str]] = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    forbid_clause = ""
    if forbidden_words:
        forbid_clause = (
            "If the item matches any forbidden keyword, do NOT create a listing; "
            "instead return exactly this JSON: "
            '{"title":"금지 품목","content":"금지 품목(<keyword>)은 등록할 수 없습니다.",'
            '"priceKRW":0,"category":"forbidden","forbiddenItem":"<keyword>"} . '
            f"Forbidden keywords: {', '.join(forbidden_words)}. "
        )

    prompt = (
        "Output only JSON for Korean secondhand transactions. "
        "The title must be within 20 characters and begin with brand + model."
        "Use detected logos, OCR text, and labels to infer the exact brand/model before writing the title. "
        "The content must stay under 120 characters and summarize condition, usage, composition, and recommended use in one paragraph. "
        "PriceKRW must be a realistic Korean Won number derived from comparable listings; never leave it zero. "
        "Think explicitly about similar items and their resale prices before finalizing priceKRW. "
        "Category should be a simple Korean category name. "
        "All sentences must be written in Korean, and no additional explanations or markdown are allowed."
        "When selecting a price, please select the price of that model, not the general price of that brand. "
        + forbid_clause
    )

    attribute_summary = build_attribute_prompt(attributes)
    attribute_blob = json.dumps(attributes, ensure_ascii=False)
    if len(attribute_blob) > 800:
        attribute_blob = attribute_blob[:797] + "..."

    contents = [
        {
            "role": "user",
            "parts": [
                {"text": f"시각 단서: {attribute_summary}"},
                {"text": f"Vision JSON 힌트: {attribute_blob}"},
                {"text": prompt},
                {"inline_data": {"mime_type": image_mime, "data": image_b64}},
            ],
        }
    ]

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.8,
            "topK": 32,
            "response_mime_type": "application/json",
            "maxOutputTokens": 512,
        },
    }
    response = SESSION.post(url, json=payload, timeout=timeout)
    response.raise_for_status()
    body = response.json()
    candidates = body.get("candidates")
    if not candidates:
        raise PipelineError(f"Gemini 응답에 후보가 없습니다: {body}")

    parts = candidates[0].get("content", {}).get("parts", [])
    text_payload = ""
    for part in parts:
        if "text" in part:
            text_payload += part["text"]
    if not text_payload:
        raise PipelineError(f"Gemini 응답 형식을 해석할 수 없습니다: {body}")

    text_payload = text_payload.strip().strip("`")
    try:
        parsed = json.loads(text_payload)
    except json.JSONDecodeError as exc:
        raise PipelineError(f"Gemini JSON 파싱 실패: {text_payload}") from exc
    if isinstance(parsed, list):
        if not parsed:
            raise PipelineError("Gemini 응답이 빈 리스트입니다.")
        if isinstance(parsed[0], dict):
            return parsed[0]
        raise PipelineError(f"Gemini 응답 형식을 해석할 수 없습니다: {parsed}")
    if not isinstance(parsed, dict):
        raise PipelineError(f"Gemini 응답 형식을 해석할 수 없습니다: {parsed}")
    return parsed


def normalize_listing(raw: Dict[str, Any]) -> Dict[str, Any]:
    def clean_text(value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip()

    def parse_price(value: Any) -> int:
        if value is None:
            return 0
        if isinstance(value, (int, float)):
            return max(0, int(value))
        text = str(value)
        digits = "".join(ch for ch in text if ch.isdigit())
        return int(digits) if digits else 0

    normalized = {
        "title": clean_text(raw.get("title")),
        "content": clean_text(raw.get("content")),
        "priceKRW": parse_price(
            raw.get("priceKRW")
            or raw.get("price")
            or raw.get("price_krw")
            or raw.get("estimatedPrice")
        ),
        "category": clean_text(raw.get("category")),
    }
    return normalized


@dataclass
class PipelineConfig:
    base_dir: Path
    upload_dir: Path
    resized_dir: Path
    output_dir: Path
    max_dimension: int
    workers: int
    vision_api_key: str
    gemini_api_key: str
    gemini_model: str
    recursive: bool


def build_config(args: argparse.Namespace) -> PipelineConfig:
    bootstrap_env()
    base_dir = Path(__file__).resolve().parent

    upload_dir = resolve_dir(args.upload_dir or os.getenv("UPLOAD_DIR", "upload"), base_dir)
    output_dir = resolve_dir(args.output_dir or os.getenv("OUTPUT_DIR", "output"), base_dir)
    resized_dir = output_dir / "resized"

    ensure_dir(upload_dir)
    ensure_dir(resized_dir)
    ensure_dir(output_dir)

    workers = args.workers or min(4, (os.cpu_count() or 2))
    max_dimension = args.max_dimension or int(
        os.getenv("IMAGE_MAX_DIMENSION", DEFAULT_MAX_DIMENSION)
    )

    vision_api_key = normalize_env_value(
        args.vision_api_key
        or os.getenv("GOOGLE_VISION_KEY")
        or os.getenv("VISION_API_KEY", "")
    )
    gemini_api_key = normalize_env_value(args.gemini_api_key or os.getenv("GEMINI_API_KEY", ""))
    gemini_model = args.gemini_model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    if not vision_api_key:
        raise ValueError("Vision API Key가 필요합니다. VISION_API_KEY 환경 변수나 CLI 인자를 확인하세요.")
    if not gemini_api_key:
        raise ValueError("Gemini API Key가 필요합니다. GEMINI_API_KEY 환경 변수나 CLI 인자를 확인하세요.")

    return PipelineConfig(
        base_dir=base_dir,
        upload_dir=upload_dir,
        resized_dir=resized_dir,
        output_dir=output_dir,
        max_dimension=max_dimension,
        workers=workers,
        vision_api_key=vision_api_key,
        gemini_api_key=gemini_api_key,
        gemini_model=gemini_model,
        recursive=args.recursive,
    )


def process_image(
    image_path: Path,
    config: PipelineConfig,
) -> Dict[str, Any]:
    start = time.perf_counter()
    resized_path = resize_image(image_path, config.resized_dir, config.max_dimension)
    mime_type, image_b64 = encode_image(resized_path)

    vision_raw = call_google_vision(image_b64, config.vision_api_key)
    attributes = summarize_vision_response(vision_raw)

    forbidden_hit = detect_forbidden(attributes)
    if forbidden_hit:
        elapsed = time.perf_counter() - start
        listing = build_forbidden_listing(forbidden_hit)
        result = {
            "source_image": display_relative_path(image_path, config.base_dir),
            "resized_image": display_relative_path(resized_path, config.base_dir),
            "vision_attributes": attributes,
            "listing": listing,
            "processing_seconds": round(elapsed, 3),
        }
        output_path = config.output_dir / f"{image_path.stem}.json"
        with output_path.open("w", encoding="utf-8") as fh:
            json.dump(listing, fh, ensure_ascii=False, indent=2)
        return result

    listing_raw = call_gemini(
        config.gemini_model,
        config.gemini_api_key,
        attributes,
        mime_type,
        image_b64,
        forbidden_words=load_forbidden_items(),
    )
    listing = normalize_listing(listing_raw)

    post_forbidden_hit = detect_forbidden_text(
        [listing.get("title", ""), listing.get("content", "")]
    )
    if post_forbidden_hit:
        listing = build_forbidden_listing(post_forbidden_hit)

    elapsed = time.perf_counter() - start
    result = {
        "source_image": display_relative_path(image_path, config.base_dir),
        "resized_image": display_relative_path(resized_path, config.base_dir),
        "vision_attributes": attributes,
        "listing": listing,
        "processing_seconds": round(elapsed, 3),
    }

    output_path = config.output_dir / f"{image_path.stem}.json"
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(listing, fh, ensure_ascii=False, indent=2)
    return result


def run_pipeline(config: PipelineConfig) -> List[Dict[str, Any]]:
    images = list_images(config.upload_dir, config.recursive)
    LOGGER.info("Processing %d images with %d workers", len(images), config.workers)

    results: List[Dict[str, Any]] = []
    errors: List[str] = []

    with ThreadPoolExecutor(max_workers=config.workers) as executor:
        futures = {executor.submit(process_image, image, config): image for image in images}
        for future in as_completed(futures):
            image = futures[future]
            try:
                result = future.result()
                results.append(result)
                LOGGER.info(
                    "완료 - %s (%.2fs)",
                    image.name,
                    result["processing_seconds"],
                )
            except Exception as exc:
                msg = f"{image}: {exc}"
                LOGGER.exception("이미지 처리 실패: %s", msg)
                errors.append(msg)

    if errors:
        raise PipelineError(f"{len(errors)}개의 이미지 처리 실패: {errors}")
    return results


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Used goods listing generator.")
    parser.add_argument("--upload-dir", help="원본 이미지 디렉터리 (기본: 환경변수 UPLOAD_DIR)")
    parser.add_argument("--output-dir", help="JSON 출력 디렉터리 (기본: 환경변수 OUTPUT_DIR)")
    parser.add_argument("--max-dimension", type=int, help="리사이즈 최대 변 길이 (픽셀)")
    parser.add_argument("--workers", type=int, help="동시 처리 워커 수")
    parser.add_argument("--vision-api-key", help="Google Vision API Key (선택, 기본 환경변수)")
    parser.add_argument("--gemini-api-key", help="Gemini API Key (선택, 기본 환경변수)")
    parser.add_argument("--gemini-model", help="Gemini 모델명 (기본: gemini-2.0-flash)")
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="하위 폴더의 이미지까지 처리",
    )
    parser.add_argument("--log-level", default="INFO", help="로깅 레벨 (기본: INFO)")
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    try:
        config = build_config(args)
    except Exception as exc:
        LOGGER.error("설정 오류: %s", exc)
        return 2

    try:
        run_pipeline(config)
    except Exception as exc:
        LOGGER.error("파이프라인 실패: %s", exc)
        return 1

    LOGGER.info("모든 이미지를 성공적으로 처리했습니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
