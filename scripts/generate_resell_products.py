#!/usr/bin/env python3
"""Utility script that converts model/Best_test JSON exports into TS seed data."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "model" / "Best_test" / "Data"
OUTPUT_TS = ROOT_DIR / "FrontEnd" / "NewTag" / "src" / "data" / "resellProducts.ts"

SOURCES = [
    {
        "path": DATA_DIR / "kream_45127_20251113_115158.json",
        "id": "kream_45127",
        "name": "missing_item_name_0",
        "brand": "kream_dataset",
        "category": "luxury",
    },
    {
        "path": DATA_DIR / "kream_83946_20251113_120619.json",
        "id": "kream_83946",
        "name": "missing_item_name_1",
        "brand": "kream_dataset",
        "category": "luxury",
    },
    {
        "path": DATA_DIR / "processed_price_date.json",
        "id": "processed_price_date",
        "name": "missing_item_name_2",
        "brand": "timeseries_dataset",
        "category": "sneakers",
    },
    {
        "path": DATA_DIR / "processed_price_date_jordan1.json",
        "id": "processed_price_date_jordan1",
        "name": "missing_item_name_3",
        "brand": "timeseries_dataset",
        "category": "sneakers",
    },
]


def clean_text(value: Any, fallback: str) -> str:
    text = str(value).strip() if value is not None else fallback
    text = text.replace('"', "'").replace("\\", "/")
    text = text.replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text or fallback


def load_history(raw: Any) -> List[Dict[str, Any]]:
    if isinstance(raw, dict):
        entries = raw.get("transactions") or []
    elif isinstance(raw, list):
        entries = raw
    else:
        return []

    history: List[Dict[str, Any]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue

        price = entry.get("price")
        if price is None:
            continue
        try:
            price_val = int(round(float(price)))
        except (TypeError, ValueError):
            continue
        if price_val <= 0:
            continue

        date_label = clean_text(entry.get("date"), f"거래 {len(history) + 1}")
        size_label = clean_text(entry.get("size"), "")
        history.append(
            {
                "price": price_val,
                "value": price_val,
                "date": date_label,
                "size": size_label,
            }
        )
        if len(history) >= 100:
            break
    return history


def build_records() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for spec in SOURCES:
        path = spec["path"]
        if not path.exists():
            raise FileNotFoundError(f"Missing data source: {path}")

        raw = json.loads(path.read_text(encoding="utf-8"))
        history = load_history(raw)

        current_price = history[0]["price"] if history else 0
        previous_price = history[-1]["price"] if len(history) > 1 else current_price

        change_percent = 0.0
        if previous_price:
            change_percent = round(((current_price - previous_price) / previous_price) * 100, 2)

        items.append(
            {
                "id": spec["id"],
                "name": spec["name"],
                "brand": spec["brand"],
                "category": spec["category"],
                "productUrl": raw.get("product_url") if isinstance(raw, dict) else None,
                "currentPrice": current_price,
                "previousPrice": previous_price,
                "changePercent": change_percent,
                "priceHistory": history,
            }
        )
    return items


def main() -> None:
    items = build_records()
    OUTPUT_TS.parent.mkdir(parents=True, exist_ok=True)

    header = """export interface ResellPricePoint {
  price: number;
  date: string;
  size: string;
}

export interface ResellProductRecord {
  id: string;
  name: string;
  brand: string;
  category: string;
  productUrl?: string;
  image?: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  priceHistory: ResellPricePoint[];
}

export const RESELL_PRODUCTS: ResellProductRecord[] = 
"""

    body = json.dumps(items, ensure_ascii=False, indent=2)
    OUTPUT_TS.write_text(header + body + " as const;\n", encoding="utf-8")
    print(f"Wrote {len(items)} products to {OUTPUT_TS}")


if __name__ == "__main__":
    main()
