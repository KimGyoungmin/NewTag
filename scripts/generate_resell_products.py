#!/usr/bin/env python3
"""Utility script that converts model/Best_test JSON exports into TS seed data."""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import torch

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "model" / "Best_test" / "Data"
MODEL_OUTPUT_ROOT = ROOT_DIR / "model" / "Best_test" / "OutPut"
OUTPUT_TS = ROOT_DIR / "FrontEnd" / "NewTag" / "src" / "data" / "resellProducts.ts"

sys.path.append(str(ROOT_DIR / "model" / "Best_test"))
import project_price  # noqa: E402

project_price.DEVICE = torch.device("cpu")

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
        "path": DATA_DIR / "processed_price_date_jordan1.json",
        "id": "processed_price_date_jordan1",
        "name": "missing_item_name_3",
        "brand": "timeseries_dataset",
        "category": "sneakers",
    },
]


def resolve_source_name(path: Path) -> str:
    try:
        relative = path.relative_to(DATA_DIR).as_posix()
    except ValueError:
        relative = path.name
    return project_price._normalize_source_name(relative)


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


def find_prediction_path(data_path: Path) -> Optional[Path]:
    source_name = resolve_source_name(data_path)
    pattern = f"run_*/*{source_name}*/price_only/predictions_h6.csv"
    candidates = sorted(MODEL_OUTPUT_ROOT.glob(pattern), key=lambda path: path.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def find_model_checkpoint(data_path: Path) -> Optional[Path]:
    source_name = resolve_source_name(data_path)
    pattern = f"run_*/*{source_name}*/price_only/tsmixer_model.pth"
    candidates = sorted(MODEL_OUTPUT_ROOT.glob(pattern), key=lambda path: path.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def _safe_round(value: Optional[float]) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, (int, np.integer)):
        return int(value)
    if isinstance(value, (float, np.floating)) and math.isfinite(float(value)):
        return int(round(float(value)))
    return None


def load_predictions_from_csv(path: Optional[Path]) -> List[Dict[str, Any]]:
    if not path or not path.exists():
        return []

    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines:
        return []

    rows: List[Dict[str, Any]] = []
    for line in lines[1:]:
        if not line.strip():
            continue
        try:
            horizon_raw, true_raw, pred_raw = line.split(",")
            horizon = int(horizon_raw)
            true_price = round(float(true_raw)) if true_raw else None
            predicted_price = round(float(pred_raw)) if pred_raw else None
        except ValueError:
            continue
        rows.append(
            {
                "horizon": horizon,
                "truePrice": true_price,
                "predictedPrice": predicted_price,
            }
        )
    return rows


def infer_predictions(data_path: Path, checkpoint_path: Path) -> List[Dict[str, Any]]:
    state_dict = torch.load(checkpoint_path, map_location=project_price.DEVICE)
    try:
        seq_len = state_dict["layers.0.time_mixing.0.weight"].shape[0]
        n_features = state_dict["layers.0.feature_mixing.0.weight"].shape[0]
        pred_len = state_dict["fc_out.weight"].shape[0]
    except KeyError as exc:  # pragma: no cover - unexpected checkpoint layout
        print(f"[WARN] {checkpoint_path.name}: missing key {exc} in checkpoint")
        return []

    try:
        raw_df = project_price.clean_price_frame(project_price.load_kream_transaction_dump(data_path))
    except Exception as exc:  # pylint: disable=broad-except
        print(f"[WARN] Failed to read {data_path.name}: {exc}")
        return []

    if raw_df.empty:
        print(f"[WARN] {data_path.name}: no valid rows after cleaning")
        return []

    daily = project_price.aggregate_daily(raw_df)
    available_points = len(daily)
    max_seq_len = available_points - pred_len - 1
    if max_seq_len <= 0:
        print(f"[WARN] {data_path.name}: insufficient history ({available_points} rows)")
        return []
    if seq_len > max_seq_len:
        print(
            f"[WARN] {data_path.name}: checkpoint expects seq_len={seq_len} "
            f"but only {max_seq_len} usable days detected"
        )
        return []

    feature_cols = ["price_avg"]
    if n_features > 1 and "size_avg" in daily.columns:
        feature_cols.append("size_avg")

    if len(feature_cols) != n_features:
        print(
            f"[WARN] {data_path.name}: expected {n_features} features but only "
            f"found columns {feature_cols}"
        )
        return []

    try:
        X_tensor, y_tensor, scaler, target_idx = project_price.prepare_tensors(
            daily, seq_len, pred_len, feature_cols, "price_avg"
        )
    except ValueError as exc:
        print(f"[WARN] {data_path.name}: tensor prep failed -> {exc}")
        return []

    model = project_price.TSMixer(
        seq_len=seq_len,
        pred_len=pred_len,
        n_features=len(feature_cols),
        n_layers=3,
        hidden_dim=128,
    ).to(project_price.DEVICE)

    model.load_state_dict(state_dict)

    pred_norm = project_price.forecast(model, X_tensor)
    pred_values = project_price.denormalize_feature(pred_norm, scaler, target_idx)
    true_norm = y_tensor[-1].detach().cpu().numpy().flatten()
    true_values = project_price.denormalize_feature(true_norm, scaler, target_idx)

    predictions: List[Dict[str, Any]] = []
    for horizon, (true_val, pred_val) in enumerate(zip(true_values, pred_values), start=1):
        predictions.append(
            {
                "horizon": horizon,
                "truePrice": _safe_round(float(true_val)),
                "predictedPrice": _safe_round(float(pred_val)),
            }
        )
    return predictions


def collect_predictions(data_path: Path) -> List[Dict[str, Any]]:
    checkpoint = find_model_checkpoint(data_path)
    if checkpoint:
        predictions = infer_predictions(data_path, checkpoint)
        if predictions:
            print(f"[INFO] Loaded predictions from {checkpoint.relative_to(ROOT_DIR)}")
            return predictions
        print(f"[WARN] Inference with {checkpoint.name} produced no rows; using CSV fallback.")

    csv_path = find_prediction_path(data_path)
    predictions = load_predictions_from_csv(csv_path)
    if predictions and csv_path:
        print(f"[INFO] Loaded predictions from {csv_path.relative_to(ROOT_DIR)}")
    elif not predictions:
        print(f"[WARN] No predictions available for {data_path.name}")
    return predictions


def _first_numeric_value(entries: List[Dict[str, Any]], key: str) -> Optional[float]:
    for entry in entries:
        value = entry.get(key)
        if isinstance(value, (int, float, np.integer, np.floating)) and math.isfinite(float(value)):
            return float(value)
    return None


def _scale_prediction_entries(predictions: List[Dict[str, Any]], scale: float) -> List[Dict[str, Any]]:
    def scale_value(value: Optional[float]) -> Optional[int]:
        if value is None:
            return None
        if not isinstance(value, (int, float, np.integer, np.floating)):
            return None
        return _safe_round(float(value) * scale)

    return [
        {
            **entry,
            "truePrice": scale_value(entry.get("truePrice")),
            "predictedPrice": scale_value(entry.get("predictedPrice")),
        }
        for entry in predictions
    ]


def harmonize_prediction_scale(
    product_id: str,
    history: List[Dict[str, Any]],
    predictions: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    if not history or not predictions:
        return predictions

    reference_price = _first_numeric_value(history, "price")
    anchor_prediction = _first_numeric_value(predictions, "predictedPrice")

    if not reference_price or not anchor_prediction or reference_price <= 0 or anchor_prediction <= 0:
        return predictions

    ratio = reference_price / anchor_prediction
    if ratio < 0.2:
        scaled = _scale_prediction_entries(predictions, ratio)
        print(
            f"[INFO] {product_id}: scaled predictions by {ratio:.3f} "
            f"(reference={reference_price:.0f}, anchor={anchor_prediction:.0f})"
        )
        return scaled

    return predictions


def build_records() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for spec in SOURCES:
        path = spec["path"]
        if not path.exists():
            raise FileNotFoundError(f"Missing data source: {path}")

        raw = json.loads(path.read_text(encoding="utf-8"))
        history = load_history(raw)
        predictions = collect_predictions(path)
        predictions = harmonize_prediction_scale(spec["id"], history, predictions)

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
                "predictions": predictions,
            }
        )
    return items


def main() -> None:
    items = build_records()
    OUTPUT_TS.parent.mkdir(parents=True, exist_ok=True)

    header = """export interface ResellPricePoint {
  price: number;
  value?: number;
  date: string;
  size: string;
}

export interface ResellPredictionPoint {
  horizon: number;
  truePrice: number | null;
  predictedPrice: number | null;
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
  predictions?: ResellPredictionPoint[];
}

export const RESELL_PRODUCTS: ResellProductRecord[] = 
"""

    body = json.dumps(items, ensure_ascii=False, indent=2)
    OUTPUT_TS.write_text(header + body + " as const;\n", encoding="utf-8")
    print(f"Wrote {len(items)} products to {OUTPUT_TS}")


if __name__ == "__main__":
    main()
