#!/usr/bin/env python
"""
Batch crawler/forecaster for KREAM products.

- Reads product_ids from product_id.txt or existing kream_{product_id}_*.json files.
- Crawls and merges daily transactions (skips if already crawled today).
- Optionally runs forecasts via project_price.py.
- Builds FrontEnd/NewTag/public/resell_auto.json for the resell page feed.
"""

from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# Ensure crawl modules are on the path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from bs4 import BeautifulSoup  # noqa: E402
import requests  # noqa: E402
from crawl_kream_cdp import crawl_kream_with_cdp  # noqa: E402

BASE_DIR = CURRENT_DIR.parent
DATA_DIR = BASE_DIR / "Best_test" / "Data"
OUTPUT_DIR = BASE_DIR / "Best_test" / "OutPut"
FRONTEND_RESELL_JSON = BASE_DIR.parent / "FrontEnd" / "NewTag" / "public" / "resell_auto.json"
FRONTEND_RESELL_IMG_DIR = FRONTEND_RESELL_JSON.parent / "resell_images"
PRODUCT_ID_LIST = BASE_DIR / "Best_test" / "product_id.txt"

# Reuse the same login credentials as the legacy script
NAVER_ID = "monthly82000"
NAVER_PW = "dd13579"
PHONE_NUMBER = "01037269034"

WAIT_TIME = 30
PRED_LEN = 7


def get_product_ids_from_filenames(data_dir: Path) -> set[str]:
    """Extract product_ids from existing kream_{product_id}_*.json filenames."""
    product_ids: set[str] = set()
    pattern = re.compile(r"kream_(\d+)_\d{8}")
    for json_path in data_dir.glob("kream_*_*.json"):
        match = pattern.search(json_path.name)
        if match:
            product_ids.add(match.group(1))
    return product_ids


def get_product_ids_from_file(path: Path) -> list[str]:
    """Read product_id.txt (ignores blanks and # comments)."""
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
    """Return the newest kream_{pid}_*.json file."""
    candidates = sorted(data_dir.glob(f"kream_{pid}_*.json"), reverse=True)
    return candidates[0] if candidates else None


def parse_timestamp_from_filename(path: Path) -> datetime | None:
    """Parse timestamp from kream_{pid}_YYYYMMDD_HHMMSS.json."""
    match = re.search(r"kream_\d+_(\d{8}_\d{6})", path.name)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y%m%d_%H%M%S")
    except ValueError:
        return None


def load_existing_transactions(latest_path: Path) -> tuple[list[dict], set[str]]:
    """Load transactions and their IDs from the latest file (best effort)."""
    try:
        with open(latest_path, encoding="utf-8") as f:
            data = json.load(f)
        txs = data.get("transactions", [])
        existing_ids = {tx.get("id") for tx in txs if isinstance(tx, dict)}
        return txs, existing_ids
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[WARN] Failed to read {latest_path.name}: {exc}")
        return [], set()


def download_product_image(product_url: str, pid: str) -> Path | None:
    """
    Fetch the product page and download og:image into public/resell_images/{pid}.png.
    Returns the local path if saved, otherwise None.
    """
    FRONTEND_RESELL_IMG_DIR.mkdir(parents=True, exist_ok=True)
    dest_path = FRONTEND_RESELL_IMG_DIR / f"{pid}.png"

    if dest_path.exists():
        return dest_path

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; NewTagCrawler/1.0; +https://example.com)"
    }

    try:
        resp = requests.get(product_url, headers=headers, timeout=10)
        if resp.status_code != 200:
            print(f"[WARN] ({pid}) failed to fetch product page: {resp.status_code}")
            return None
        soup = BeautifulSoup(resp.text, "html.parser")
        og = soup.find("meta", property="og:image")
        img_url = og.get("content") if og else None
        if not img_url:
            print(f"[WARN] ({pid}) og:image not found")
            return None
        if img_url.startswith("//"):
            img_url = "https:" + img_url
        if img_url.startswith("/"):
            # Relative path; prepend host
            base = re.match(r"^https?://[^/]+", product_url)
            if base:
                img_url = base.group(0) + img_url
        img_resp = requests.get(img_url, headers=headers, timeout=10)
        if img_resp.status_code != 200:
            print(f"[WARN] ({pid}) failed to download image: {img_resp.status_code}")
            return None
        dest_path.write_bytes(img_resp.content)
        print(f"[OK] ({pid}) downloaded image -> {dest_path.name}")
        return dest_path
    except Exception as exc:
        print(f"[WARN] ({pid}) image download failed: {exc}")
        return None


def save_result(pid: str, result: dict, data_dir: Path) -> None:
    """Save merged crawl result to kream_{pid}_{timestamp}.json."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = data_dir / f"kream_{pid}_{timestamp}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[OK] Saved: {out_path}")


def crawl_and_merge(pid: str, data_dir: Path) -> bool:
    """Crawl a single product_id and merge with previous transactions.
    Returns True when new data was saved, False when skipped.
    """
    latest_path = find_latest_file_for_pid(data_dir, pid)
    existing_transactions: list[dict] = []
    existing_ids: set[str] = set()

    if latest_path:
        ts = parse_timestamp_from_filename(latest_path)
        if ts and ts.date() == datetime.now().date():
            print(f"- {pid}: already crawled today -> {latest_path.name} (skip)")
            return False
        existing_transactions, existing_ids = load_existing_transactions(latest_path)
        print(f"- {pid}: loaded {len(existing_transactions)} existing rows from {latest_path.name}")

    product_url = f"https://kream.co.kr/products/{pid}"
    print(f"- {pid}: crawling {product_url}")
    result = crawl_kream_with_cdp(
        product_url=product_url,
        naver_id=NAVER_ID,
        naver_pw=NAVER_PW,
        phone_number=PHONE_NUMBER,
        wait_time=WAIT_TIME,
    )

    new_transactions = [
        tx for tx in result.get("transactions", []) if isinstance(tx, dict) and tx.get("id") not in existing_ids
    ]

    if not new_transactions:
        print(f"- {pid}: no new transactions (skip)")
        return False

    combined = existing_transactions + new_transactions
    result["transactions"] = combined
    result["total_transactions"] = len(combined)

    save_result(pid, result, data_dir)
    return True


def normalize_source_name(name: str) -> str:
    slug = re.sub(r"[^0-9a-zA-Z_]+", "_", name)
    return slug.strip("_") or "custom"


def run_forecast_all(data_dir: Path, run_tag: str) -> Path:
    """
    Execute project_price.py for all JSON sources to generate forecasts.
    Returns the output directory path.
    """
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
    print(f"\n=== Running forecast: {' '.join(cmd)} ===")
    subprocess.run(cmd, check=True, cwd=project_price.parent)
    return OUTPUT_DIR / run_tag


def build_resell_feed(data_dir: Path, output_root: Path) -> None:
    """Convert crawl/forecast outputs into FrontEnd resell_auto.json."""
    records: List[Dict[str, Any]] = []
    # Preserve existing predictions when possible to avoid wiping graphs on feed-only runs.
    existing_feed: Dict[str, dict] = {}
    if FRONTEND_RESELL_JSON.exists():
        try:
            with open(FRONTEND_RESELL_JSON, encoding="utf-8") as f:
                for item in json.load(f):
                    if isinstance(item, dict) and item.get("id"):
                        existing_feed[item["id"]] = item
        except Exception as exc:  # pragma: no cover - defensive
            print(f"[WARN] Failed to load existing resell_auto.json: {exc}")

    mode_dir = "price_only"
    pred_file = f"predictions_h{PRED_LEN}.csv"

    def pick_names(source: dict) -> tuple[str | None, str | None]:
        """
        Choose (korean_name, english_name) from crawl JSON first.
        Filters out generic placeholders and requires script-specific characters to avoid mojibake.
        """
        raw_ko = (source.get("koreanName") or source.get("name") or "").strip()
        raw_en = (source.get("englishName") or source.get("name_en") or source.get("name") or "").strip()

        def has_korean(text: str) -> bool:
            return bool(re.search(r"[가-힣]", text))

        def has_latin(text: str) -> bool:
            return bool(re.search(r"[A-Za-z]", text))

        def is_generic(text: str) -> bool:
            if not text:
                return True
            generic_terms = [
                "상품",
                "검수 특이사항 안내",
                "확인하세요",
            ]
            return any(term in text for term in generic_terms)

        name_ko = raw_ko if raw_ko and has_korean(raw_ko) and not is_generic(raw_ko) else None
        name_en = raw_en if raw_en and has_latin(raw_en) and not is_generic(raw_en) else None
        return name_ko, name_en

    product_ids = get_product_ids_from_filenames(data_dir)
    if not product_ids:
        print("[WARN] No kream_* data files found; skip feed build.")
        return

    for pid in sorted(product_ids):
        json_path = find_latest_file_for_pid(data_dir, pid)
        if not json_path:
            print(f"[WARN] No data file found for pid={pid}, skip")
            continue

        try:
            with open(json_path, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as exc:
            print(f"[WARN] Failed to read {json_path.name}: {exc}")
            continue

        product_url = data.get("product_url") or f"https://kream.co.kr/products/{pid}"
        transactions = data.get("transactions") or []

        price_list: list[float] = []
        price_history: list[dict] = []
        for tx in transactions:
            if not isinstance(tx, dict):
                continue
            try:
                price_val = float(tx.get("price"))
            except Exception:
                continue
            price_list.append(price_val)
            price_history.append(
                {
                    "price": price_val,
                    "value": price_val,
                    "date": tx.get("date"),
                    "size": tx.get("size") or "",
                }
            )

        current_price = price_list[-1] if price_list else 0.0
        prev_price = price_list[-2] if len(price_list) >= 2 else current_price
        change_percent = ((current_price - prev_price) / prev_price * 100) if prev_price else 0.0

        rel = json_path.relative_to(data_dir).as_posix()
        source_slug = normalize_source_name(rel)
        pred_path = output_root / source_slug / mode_dir / pred_file
        predictions: list[dict[str, Any]] = []

        if pred_path.exists():
            try:
                with open(pred_path, newline="", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for idx, row in enumerate(reader, start=1):
                        horizon_raw = row.get("horizon_day") or idx
                        try:
                            horizon_val = int(float(horizon_raw))
                        except Exception:
                            horizon_val = idx

                        true_raw = row.get("true_price")
                        try:
                            true_val = float(true_raw) if true_raw not in (None, "", "nan") else None
                        except Exception:
                            true_val = None

                        try:
                            pred_val = float(row.get("tsmixer_price"))
                        except Exception:
                            continue

                        predictions.append(
                            {
                                "horizon": horizon_val,
                                "truePrice": true_val,
                                "predictedPrice": pred_val,
                            }
                        )
            except Exception as exc:
                print(f"[WARN] Failed to read prediction file ({pred_path}): {exc}")
        else:
            print(f"[WARN] Prediction file missing: {pred_path}")

        # Reuse previous predictions if the current run cannot find any.
        existing_preds = (existing_feed.get(f"kream_{pid}") or {}).get("predictions") or []
        if not predictions and existing_preds:
            predictions = existing_preds
            print(f"[INFO] Reused existing predictions for pid={pid}")

        # If predictions are far off (e.g., 10x), scale down by 1/10
        if predictions:
            hist_median = sorted(price_list)[len(price_list) // 2] if price_list else 0.0
            pred_values = [p["predictedPrice"] for p in predictions if p.get("predictedPrice") is not None]
            if hist_median and pred_values:
                pred_median = sorted(pred_values)[len(pred_values) // 2]
                if pred_median > hist_median * 5 and (pred_median / 10) <= hist_median * 5:
                    predictions = [
                        {**p, "predictedPrice": (p["predictedPrice"] / 10 if p.get("predictedPrice") else None)}
                        for p in predictions
                    ]
                    print(f"[INFO] Scaled predictions by 1/10 for pid={pid} (outlier correction)")

        name_ko, name_en = pick_names(data)
        # Ensure product image is available (download og:image once per pid)
        local_image_path = download_product_image(product_url, pid)
        if local_image_path and not local_image_path.exists():
            local_image_path = None
        local_image_url = f"/resell_images/{pid}.png" if local_image_path else None

        record = {
            "id": f"kream_{pid}",
            "name": name_en or name_ko or f"kream 상품 {pid}",
            "nameKo": name_ko or name_en or f"kream 상품 {pid}",
            "brand": "kream_dataset",
            "category": "resell",
            "productUrl": product_url,
            "currentPrice": current_price,
            "previousPrice": prev_price,
            "changePercent": round(change_percent, 2),
            "priceHistory": price_history,
            "predictions": predictions,
            "image": local_image_url,
        }
        records.append(record)

    # Stable ordering to reduce merge conflicts in the generated JSON.
    records = sorted(records, key=lambda item: item.get("id") or "")

    FRONTEND_RESELL_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_RESELL_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"[OK] Wrote resell feed: {FRONTEND_RESELL_JSON}")


def get_latest_output_dir() -> Path | None:
    candidates = [
        p
        for p in OUTPUT_DIR.iterdir()
        if p.is_dir() and (p.name.startswith("run_") or p.name.startswith("resell_auto_"))
    ]
    candidates = sorted(candidates, key=lambda path: path.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    args = sys.argv[1:]

    skip_crawl = "--no-crawl" in args or "--feed-only" in args
    skip_predict = "--no-predict" in args or "--feed-only" in args
    output_override: Path | None = None

    for arg in args:
        if arg.startswith("--use-output="):
            output_override = Path(arg.split("=", 1)[1]).resolve()

    # Prefer product_id.txt; if empty, derive from filenames
    file_ids = get_product_ids_from_file(PRODUCT_ID_LIST)
    if file_ids:
        product_ids = set(file_ids)
        print(f"Loaded {len(product_ids)} ids from product_id.txt: {sorted(product_ids)}")
    else:
        product_ids = get_product_ids_from_filenames(DATA_DIR)

    if not product_ids:
        print("No product_id found in Data directory. Please add kream_{product_id}_*.json or product_id.txt.")
        sys.exit(1)

    run_tag = f"resell_auto_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print(f"Target product_ids: {sorted(product_ids)}")
    any_crawled = False
    if not skip_crawl:
        for pid in sorted(product_ids):
            if crawl_and_merge(pid, DATA_DIR):
                any_crawled = True
    else:
        print("Skipping crawl (--no-crawl/--feed-only)")

    print("\nAll crawling steps finished.")

    # If 오늘 크롤링 결과가 모두 스킵되었다면, 학습도 스킵하고 기존 예측을 재사용
    if not skip_predict and not any_crawled:
        skip_predict = True
        print("No new crawl today -> skip forecast and reuse latest predictions.")

    if skip_predict:
        if output_override and output_override.exists():
            output_root = output_override
        else:
            output_root = get_latest_output_dir()
        if not output_root:
            print("Prediction skipped but no previous OutPut found. Provide --use-output=PATH or run without --no-predict.")
            sys.exit(1)
        print(f"Skipping forecast (--no-predict/--feed-only or no new crawl). Reusing: {output_root}")
    else:
        output_root = run_forecast_all(DATA_DIR, run_tag)

    build_resell_feed(DATA_DIR, output_root)
    print("\nResell page feed generation completed.")


if __name__ == "__main__":
    main()
