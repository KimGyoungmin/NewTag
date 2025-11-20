#!/usr/bin/env python
"""
Data 폴더 내 기존 kream_{product_id}_*.json 파일명을 기반으로
모든 상품을 자동 크롤링하고, 새 거래만 병합하여 같은 형식으로 저장.
"""

from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# 크롤러 모듈 import 위한 경로 추가
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from crawl_kream_cdp import crawl_kream_with_cdp  # noqa: E402

BASE_DIR = CURRENT_DIR.parent
DATA_DIR = BASE_DIR / "Best_test" / "Data"
OUTPUT_DIR = BASE_DIR / "Best_test" / "OutPut"
FRONTEND_RESELL_JSON = BASE_DIR.parent / "FrontEnd" / "NewTag" / "public" / "resell_auto.json"
PRODUCT_ID_LIST = BASE_DIR / "Best_test" / "product_id.txt"

# 네이버 로그인 정보 (기존 스크립트 값과 동일)
NAVER_ID = "monthly82000"
NAVER_PW = "dd13579"
PHONE_NUMBER = "01037269034"

WAIT_TIME = 30
PRED_LEN = 7


def get_product_ids_from_filenames(data_dir: Path) -> set[str]:
    """kream_{product_id}_*.json 파일명에서 product_id 추출"""
    product_ids: set[str] = set()
    pattern = re.compile(r"kream_(\d+)_\d{8}")
    for json_path in data_dir.glob("kream_*_*.json"):
        match = pattern.search(json_path.name)
        if match:
            product_ids.add(match.group(1))
    return product_ids


def get_product_ids_from_file(path: Path) -> list[str]:
    """product_id.txt에서 ID 목록을 읽어 반환 (# 주석, 공백 줄 무시)"""
    ids: list[str] = []
    if not path.exists():
        return ids
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            ids.append(line)
    return ids


def find_latest_file_for_pid(data_dir: Path, pid: str) -> Path | None:
    """해당 product_id의 최신 파일 경로 반환"""
    candidates = sorted(data_dir.glob(f"kream_{pid}_*.json"), reverse=True)
    return candidates[0] if candidates else None


def parse_timestamp_from_filename(path: Path) -> datetime | None:
    """kream_{pid}_YYYYMMDD_HHMMSS.json에서 날짜/시간 추출"""
    match = re.search(r"kream_\d+_(\d{8}_\d{6})", path.name)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y%m%d_%H%M%S")
    except ValueError:
        return None


def load_existing_transactions(latest_path: Path) -> tuple[list[dict], set[str]]:
    """기존 파일에서 거래 리스트와 id 집합 반환"""
    try:
        with open(latest_path, encoding="utf-8") as f:
            data = json.load(f)
        txs = data.get("transactions", [])
        existing_ids = {tx.get("id") for tx in txs if isinstance(tx, dict)}
        return txs, existing_ids
    except Exception as e:
        print(f"⚠ 기존 파일 읽기 실패 ({latest_path.name}): {e}")
        return [], set()


def save_result(pid: str, result: dict, data_dir: Path):
    """결과를 kream_{pid}_{timestamp}.json 형식으로 저장"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = data_dir / f"kream_{pid}_{timestamp}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"✓ 저장 완료: {out_path}")


def crawl_and_merge(pid: str, data_dir: Path):
    """단일 product_id에 대해 크롤링 후 새 거래만 병합"""
    latest_path = find_latest_file_for_pid(data_dir, pid)
    existing_transactions, existing_ids = ([], set())
    if latest_path:
        ts = parse_timestamp_from_filename(latest_path)
        if ts and ts.date() == datetime.now().date():
            print(f"- {pid}: 오늘({ts.date()}) 이미 크롤링된 파일이 있어 스킵합니다 -> {latest_path.name}")
            return
        existing_transactions, existing_ids = load_existing_transactions(latest_path)
        print(f"- {pid}: 기존 파일 {latest_path.name}에서 {len(existing_transactions)}건 로드")

    product_url = f"https://kream.co.kr/products/{pid}"
    print(f"- {pid}: 크롤링 시작 ({product_url})")
    result = crawl_kream_with_cdp(
        product_url=product_url,
        naver_id=NAVER_ID,
        naver_pw=NAVER_PW,
        phone_number=PHONE_NUMBER,
        wait_time=WAIT_TIME,
    )

    new_transactions = [
        tx for tx in result.get("transactions", []) if tx.get("id") not in existing_ids
    ]

    if not new_transactions:
        print(f"- {pid}: 새 거래 없음 (스킵)")
        return

    combined = existing_transactions + new_transactions
    result["transactions"] = combined
    result["total_transactions"] = len(combined)

    save_result(pid, result, data_dir)


def normalize_source_name(name: str) -> str:
    slug = re.sub(r"[^0-9a-zA-Z_]+", "_", name)
    return slug.strip("_") or "custom"


def run_forecast_all(data_dir: Path, run_tag: str) -> Path:
    """project_price.py를 호출해 모든 JSON을 7일 예측으로 처리"""
    project_price = BASE_DIR / "Best_test" / "project_price.py"
    cmd = [
        sys.executable,
        str(project_price),
        "--auto-data",
        "--pred-len",
        str(PRED_LEN),
        "--run-tag",
        run_tag,
        "--future-only-plot",
        "--tsmixer-trials",
        "1",
    ]
    print(f"\n=== 예측 실행: {' '.join(cmd)} ===")
    subprocess.run(cmd, check=True, cwd=project_price.parent)
    return OUTPUT_DIR / run_tag


def build_resell_feed(data_dir: Path, output_root: Path):
    """크롤링/예측 결과를 프론트용 JSON으로 변환"""
    records: List[Dict[str, Any]] = []
    mode_dir = "price_only"
    pred_file = f"predictions_h{PRED_LEN}.csv"

    for json_path in sorted(data_dir.glob("kream_*_*.json")):
        try:
            with open(json_path, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"⚠ {json_path.name} 읽기 실패: {e}")
            continue

        pid = str(data.get("product_id") or "").strip()
        if not pid:
            print(f"⚠ {json_path.name}: product_id 없음, 스킵")
            continue

        product_url = data.get("product_url") or f"https://kream.co.kr/products/{pid}"
        transactions = data.get("transactions") or []

        # 가격 정보 (마지막 거래를 현재가로 사용)
        price_list = []
        for tx in transactions:
            if not isinstance(tx, dict):
                continue
            try:
                price_list.append(float(tx.get("price")))
            except Exception:
                continue

        current_price = price_list[-1] if price_list else 0.0
        prev_price = price_list[-2] if len(price_list) >= 2 else current_price
        change_percent = (
            ((current_price - prev_price) / prev_price * 100) if prev_price else 0.0
        )

        price_history = []
        for tx in transactions:
            if not isinstance(tx, dict):
                continue
            price_history.append(
                {
                    "price": tx.get("price"),
                    "value": tx.get("price"),
                    "date": tx.get("date"),
                    "size": tx.get("size") or "",
                }
            )

        # 예측 읽기 (project_price 출력)
        rel = json_path.relative_to(data_dir).as_posix()
        source_slug = normalize_source_name(rel)
        pred_path = output_root / source_slug / mode_dir / pred_file
        predictions = []
        if pred_path.exists():
            try:
                with open(pred_path, newline="", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for idx, row in enumerate(reader, start=1):
                        # BOM 제거 및 키 정규화
                        norm_row = {k.lstrip("\ufeff"): v for k, v in row.items()}

                        horizon_raw = norm_row.get("horizon_day") or idx
                        try:
                            horizon_val = int(float(horizon_raw))
                        except Exception:
                            horizon_val = idx

                        true_raw = norm_row.get("true_price")
                        try:
                            true_val = float(true_raw) if true_raw not in (None, "", "nan") else None
                        except Exception:
                            true_val = None

                        try:
                            pred_val = float(norm_row.get("tsmixer_price"))
                        except Exception:
                            continue

                        predictions.append(
                            {
                                "horizon": horizon_val,
                                "truePrice": true_val,
                                "predictedPrice": pred_val,
                            }
                        )
            except Exception as e:
                print(f"⚠ 예측 파일 읽기 실패 ({pred_path}): {e}")
        else:
            print(f"⚠ 예측 파일 없음: {pred_path}")

        # 예측 값이 현저히 크게 나올 경우(10배 근처) 보정
        if predictions:
            hist_median = 0.0
            if price_list:
                hist_median = sorted(price_list)[len(price_list) // 2]
            pred_values = [p["predictedPrice"] for p in predictions if p.get("predictedPrice") is not None]
            if hist_median and pred_values:
                pred_median = sorted(pred_values)[len(pred_values) // 2]
                if pred_median > hist_median * 5 and (pred_median / 10) <= hist_median * 5:
                    predictions = [{**p, "predictedPrice": (p["predictedPrice"] / 10 if p.get("predictedPrice") else None)} for p in predictions]
                    print(f"  ↳ 예측 값이 실제 대비 크게 나와 1/10로 보정합니다 (pid={pid})")

        record = {
            "id": f"kream_{pid}",
            "name": f"kream 상품 {pid}",
            "brand": "kream_dataset",
            "category": "resell",
            "productUrl": product_url,
            "currentPrice": current_price,
            "previousPrice": prev_price,
            "changePercent": round(change_percent, 2),
            "priceHistory": price_history,
            "predictions": predictions,
        }
        records.append(record)

    FRONTEND_RESELL_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_RESELL_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"✓ 프론트 연동 JSON 저장: {FRONTEND_RESELL_JSON}")


def get_latest_output_dir() -> Path | None:
    candidates = sorted([p for p in OUTPUT_DIR.glob("run_*") if p.is_dir()], reverse=True)
    return candidates[0] if candidates else None


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    args = sys.argv[1:]
    skip_crawl = "--no-crawl" in args or "--feed-only" in args
    skip_predict = "--no-predict" in args or "--feed-only" in args
    output_override = None
    for arg in args:
        if arg.startswith("--use-output="):
            output_override = Path(arg.split("=", 1)[1]).resolve()

    # 우선 product_id.txt를 사용하고, 비어있으면 파일명 기반으로 대체
    file_ids = get_product_ids_from_file(PRODUCT_ID_LIST)
    if file_ids:
        product_ids = set(file_ids)
        print(f"product_id.txt에서 {len(product_ids)}개 로드: {sorted(product_ids)}")
    else:
        product_ids = get_product_ids_from_filenames(DATA_DIR)

    if not product_ids:
        print("Data 폴더에서 product_id를 찾지 못했습니다. kream_{product_id}_*.json 파일이 필요합니다.")
        sys.exit(1)

    run_tag = f"resell_auto_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print(f"대상 product_id 목록: {sorted(product_ids)}")
    if not skip_crawl:
        for pid in sorted(product_ids):
            crawl_and_merge(pid, DATA_DIR)
    else:
        print("크롤링 스킵(--no-crawl/--feed-only)")

    print("\n✓ 모든 상품 크롤링 단계 완료 (또는 스킵됨)")

    # 크롤링 후 예측 + 프론트 JSON 생성
    if skip_predict:
        if output_override and output_override.exists():
            output_root = output_override
        else:
            output_root = get_latest_output_dir()
        if not output_root:
            print("⚠ 예측 스킵 옵션을 사용했지만 기존 OutPut 디렉토리를 찾지 못했습니다.")
            sys.exit(1)
        print(f"예측 스킵(--no-predict/--feed-only). 기존 예측 결과 사용: {output_root}")
    else:
        output_root = run_forecast_all(DATA_DIR, run_tag)

    build_resell_feed(DATA_DIR, output_root)
    print("\n✓ 리셀 페이지 데이터 생성 완료")


if __name__ == "__main__":
    main()
