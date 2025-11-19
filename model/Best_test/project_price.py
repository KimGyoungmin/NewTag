#!/usr/bin/env python
"""End-to-end price forecasting script migrated from the Colab notebook."""

from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import MinMaxScaler

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "Data"
OUTPUT_DIR = BASE_DIR / "OutPut"
FORCEDATA_PATH = DATA_DIR / "forcedata_jordan1_converted.json"
KREAM_PATH = DATA_DIR / "kream_timeseries_output.json"
KREAM_FUTURE_PATH = DATA_DIR / "kream_timeseries_output_fut.json"
ONE_SIZE_PATH = DATA_DIR / "one_size_cleaned.json"

SEQ_LEN = 24
PRED_LEN = 6
HISTORY_DAYS = 30
FUTURE_ONLY_PLOT = False
USE_SIZE_FEATURE = False
BATCH_SIZE = 32
LR = 1e-3
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
TSMIXER_TRIALS = 10

DATA_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


def _require_file(path: Path) -> Path:
    if not path.exists():
        raise FileNotFoundError(f"Required data file missing: {path}")
    return path


def _normalize_source_name(name: str) -> str:
    slug = re.sub(r"[^0-9a-zA-Z_]+", "_", name)
    return slug.strip("_") or "custom"


def load_forcedata(path: Path) -> pd.DataFrame:
    df = pd.read_json(_require_file(path), encoding="utf-8")
    df = df.rename(columns={"Unnamed: 2": "timestamp", "Unnamed: 1": "price"})
    cols = ["timestamp", "price"]
    if "size" in df.columns:
        cols.append("size")
    return df[cols]


def load_kream_data(path: Path) -> pd.DataFrame:
    df = pd.read_json(_require_file(path), encoding="utf-8")
    df = df.rename(columns={"time": "timestamp", "price_krw": "price"})
    cols = ["timestamp", "price"]
    if "size" in df.columns:
        cols.append("size")
    return df[cols]


def load_kream_future_data(path: Path) -> pd.DataFrame:
    df = pd.read_json(_require_file(path), encoding="utf-8")
    df = df.rename(columns={"date": "timestamp", "price_krw": "price"})
    cols = ["timestamp", "price"]
    if "size" in df.columns:
        cols.append("size")
    return df[cols]


def load_kream_transaction_dump(path: Path) -> pd.DataFrame:
    data = json.loads(_require_file(path).read_text(encoding="utf-8"))
    if isinstance(data, dict):
        records = data.get("transactions", [])
    else:
        records = data
    if not isinstance(records, list):
        raise ValueError("Unsupported JSON structure for custom input.")
    df = pd.DataFrame(records)
    df = df.rename(columns={"date": "timestamp"})
    keep_cols = [col for col in ["timestamp", "price", "size"] if col in df.columns]
    return df[keep_cols]


def load_one_size_data(path: Path) -> pd.DataFrame:
    df = pd.read_json(_require_file(path), encoding="utf-8")
    df = df.rename(columns={"date": "timestamp"})
    return df[["timestamp", "price"]]


def clean_price_frame(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned["price"] = (
        cleaned["price"]
        .astype(str)
        .str.replace(r"\D", "", regex=True)
        .replace("", np.nan)
        .astype("Float64")
    )
    cleaned["timestamp"] = pd.to_datetime(
        cleaned["timestamp"], format="%y/%m/%d", errors="coerce"
    )

    size_col = next((col for col in cleaned.columns if col.lower() == "size"), None)
    if size_col is not None:
        size_series = cleaned[size_col]
        numeric = pd.to_numeric(size_series, errors="coerce")
        if numeric.notna().sum() >= len(size_series) * 0.5:
            cleaned["size"] = numeric
        else:
            codes, _ = pd.factorize(size_series.fillna("UNKNOWN"))
            cleaned["size"] = codes.astype(np.float32)

    keep_cols = ["timestamp", "price"]
    if "size" in cleaned.columns:
        keep_cols.append("size")

    cleaned = cleaned[keep_cols]
    cleaned = cleaned.dropna(subset=["timestamp", "price"])
    cleaned["price"] = cleaned["price"].astype(np.float32)
    if "size" in cleaned.columns:
        cleaned["size"] = cleaned["size"].astype(np.float32)
    return cleaned


def aggregate_daily(df: pd.DataFrame) -> pd.DataFrame:
    value_cols = [col for col in df.columns if col != "timestamp"]
    agg = (
        df.sort_values("timestamp")
        .groupby("timestamp", as_index=False)[value_cols]
        .mean()
    )
    rename_map = {"price": "price_avg", "size": "size_avg"}
    agg = agg.rename(columns={src: dst for src, dst in rename_map.items() if src in agg.columns})
    return agg


SOURCE_SPECS = {
    "forcedata": (load_forcedata, FORCEDATA_PATH),
    "kream": (load_kream_data, KREAM_PATH),
    "one_size": (load_one_size_data, ONE_SIZE_PATH),
}

FUTURE_ACTUAL_SPECS = {
    "kream": (load_kream_future_data, KREAM_FUTURE_PATH),
}


def normalize_features(values: np.ndarray) -> Tuple[np.ndarray, MinMaxScaler]:
    scaler = MinMaxScaler()
    normalized = scaler.fit_transform(values)
    return normalized.astype(np.float32), scaler


def create_dataset(
    data: np.ndarray, seq_len: int, pred_len: int, target_idx: int = 0
) -> Tuple[np.ndarray, np.ndarray]:
    samples = len(data) - seq_len - pred_len + 1
    if samples <= 0:
        raise ValueError(
            f"Not enough data points ({len(data)}) for seq_len={seq_len} "
            f"and pred_len={pred_len}"
        )
    X, y = [], []
    for i in range(samples):
        X.append(data[i : i + seq_len])
        y.append(data[i + seq_len : i + seq_len + pred_len, target_idx])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


def prepare_tensors(
    df: pd.DataFrame, seq_len: int, pred_len: int, feature_cols: list[str], target_col: str
):
    values = df[feature_cols].to_numpy(dtype=np.float32)
    normalized, scaler = normalize_features(values)
    target_idx = feature_cols.index(target_col)
    features, targets = create_dataset(normalized, seq_len, pred_len, target_idx)
    X_tensor = torch.tensor(features, dtype=torch.float32, device=DEVICE)
    y_tensor = torch.tensor(targets, dtype=torch.float32, device=DEVICE)
    return X_tensor, y_tensor, scaler, target_idx


def denormalize_feature(
    values: np.ndarray, scaler: MinMaxScaler, feature_idx: int
) -> np.ndarray:
    scale = scaler.scale_[feature_idx]
    data_min = scaler.data_min_[feature_idx]
    if np.isclose(scale, 0.0):
        return np.full_like(values, fill_value=data_min, dtype=np.float32)
    return values / scale + data_min


def _train_sequence_model(
    model: nn.Module, X: torch.Tensor, y: torch.Tensor, epochs: int
) -> nn.Module:
    model = model.to(DEVICE)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)
    dataset_size = X.size(0)

    for epoch in range(epochs):
        permutation = torch.randperm(dataset_size, device=DEVICE)
        epoch_loss = 0.0
        for start in range(0, dataset_size, BATCH_SIZE):
            idx = permutation[start : start + BATCH_SIZE]
            batch_x = X.index_select(0, idx)
            batch_y = y.index_select(0, idx)

            optimizer.zero_grad()
            pred = model(batch_x)
            loss = criterion(pred, batch_y)
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item() * batch_x.size(0)

        print(f"Epoch {epoch + 1:03}/{epochs} | Loss: {epoch_loss / dataset_size:.6f}")

    return model


def forecast(model: nn.Module, X: torch.Tensor) -> np.ndarray:
    model.eval()
    with torch.no_grad():
        return model(X[-1:].to(DEVICE)).cpu().numpy().flatten()


class LSTMForecaster(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64, num_layers=2, pred_len=6):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, pred_len)

    def forward(self, x):
        batch_size = x.size(0)
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim, device=x.device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim, device=x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class BiLSTMForecaster(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64, num_layers=2, pred_len=6):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_dim,
            hidden_dim,
            num_layers,
            batch_first=True,
            bidirectional=True,
        )
        self.fc = nn.Linear(hidden_dim * 2, pred_len)

    def forward(self, x):
        batch_size = x.size(0)
        num_dirs = 2
        h0 = torch.zeros(
            self.num_layers * num_dirs, batch_size, self.hidden_dim, device=x.device
        )
        c0 = torch.zeros(
            self.num_layers * num_dirs, batch_size, self.hidden_dim, device=x.device
        )
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class PositionalEncoding(nn.Module):
    def __init__(self, model_dim: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, model_dim)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, model_dim, 2).float() * (-math.log(10000.0) / model_dim)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        seq_len = x.size(1)
        return x + self.pe[:, :seq_len]


class TransformerForecaster(nn.Module):
    def __init__(
        self,
        input_dim=1,
        model_dim=64,
        num_heads=4,
        num_layers=3,
        pred_len=6,
        dropout=0.1,
    ):
        super().__init__()
        self.input_proj = nn.Linear(input_dim, model_dim)
        self.pos_encoder = PositionalEncoding(model_dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=model_dim,
            nhead=num_heads,
            dim_feedforward=128,
            dropout=dropout,
            batch_first=True,
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer, num_layers=num_layers
        )
        self.fc_out = nn.Linear(model_dim, pred_len)

    def forward(self, x):
        x = self.input_proj(x)
        x = self.pos_encoder(x)
        out = self.transformer_encoder(x)
        return self.fc_out(out[:, -1, :])


class SCINetBlock(nn.Module):
    def __init__(self, in_channels, kernel_size=5, hidden_dim=64):
        super().__init__()
        padding = kernel_size // 2
        self.conv1 = nn.Conv1d(in_channels, hidden_dim, kernel_size, padding=padding)
        self.act = nn.GELU()
        self.conv2 = nn.Conv1d(hidden_dim, in_channels, kernel_size, padding=padding)

    def forward(self, x):
        residual = x
        out = self.conv1(x)
        out = self.act(out)
        out = self.conv2(out)
        return out + residual


class SCINetTree(nn.Module):
    def __init__(self, in_channels, level=2, hidden_dim=64):
        super().__init__()
        self.level = level
        self.block = SCINetBlock(in_channels, hidden_dim=hidden_dim)
        if level > 1:
            self.sub1 = SCINetTree(in_channels, level=level - 1, hidden_dim=hidden_dim)
            self.sub2 = SCINetTree(in_channels, level=level - 1, hidden_dim=hidden_dim)

    def forward(self, x):
        even = x[:, :, ::2]
        odd = x[:, :, 1::2]
        even = self.block(even)
        odd = self.block(odd)
        if self.level > 1:
            even = self.sub1(even)
            odd = self.sub2(odd)
        min_len = min(even.size(2), odd.size(2))
        interleaved = torch.stack(
            [even[:, :, :min_len], odd[:, :, :min_len]], dim=-1
        ).view(x.size(0), x.size(1), -1)
        return interleaved


class SCINet(nn.Module):
    def __init__(self, seq_len, pred_len, n_features, levels=2, hidden_dim=64):
        super().__init__()
        self.encoder = SCINetTree(n_features, level=levels, hidden_dim=hidden_dim)
        self.flatten = nn.Flatten()
        self.fc = nn.LazyLinear(pred_len)

    def forward(self, x):
        x = x.transpose(1, 2)
        x = self.encoder(x)
        x = self.flatten(x)
        return self.fc(x)


class MixerLayer(nn.Module):
    def __init__(self, n_features, seq_len, hidden_dim=128):
        super().__init__()
        self.time_mixing = nn.Sequential(
            nn.LayerNorm(seq_len),
            nn.Linear(seq_len, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, seq_len),
        )
        self.feature_mixing = nn.Sequential(
            nn.LayerNorm(n_features),
            nn.Linear(n_features, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, n_features),
        )

    def forward(self, x):
        x_time = x + self.time_mixing(x.transpose(1, 2)).transpose(1, 2)
        return x_time + self.feature_mixing(x_time)


class TSMixer(nn.Module):
    def __init__(self, seq_len, pred_len, n_features, n_layers=3, hidden_dim=128):
        super().__init__()
        self.layers = nn.ModuleList(
            [MixerLayer(n_features, seq_len, hidden_dim) for _ in range(n_layers)]
        )
        self.fc_out = nn.Linear(seq_len * n_features, pred_len)

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        x = x.reshape(x.size(0), -1)
        return self.fc_out(x)


def train_lstm(X: torch.Tensor, y: torch.Tensor, seq_len: int) -> nn.Module:
    print("\n=== Training LSTM ===")
    model = LSTMForecaster(input_dim=1, hidden_dim=64, num_layers=2, pred_len=PRED_LEN)
    return _train_sequence_model(model, X, y, epochs=50)


def train_bilstm(X: torch.Tensor, y: torch.Tensor, seq_len: int) -> nn.Module:
    print("\n=== Training BiLSTM ===")
    model = BiLSTMForecaster(input_dim=1, hidden_dim=64, num_layers=2, pred_len=PRED_LEN)
    return _train_sequence_model(model, X, y, epochs=50)


def train_transformer(X: torch.Tensor, y: torch.Tensor, seq_len: int) -> nn.Module:
    print("\n=== Training Transformer ===")
    model = TransformerForecaster(
        input_dim=1,
        model_dim=64,
        num_heads=4,
        num_layers=3,
        pred_len=PRED_LEN,
    )
    return _train_sequence_model(model, X, y, epochs=50)


def train_scinet(X: torch.Tensor, y: torch.Tensor, seq_len: int) -> nn.Module:
    print("\n=== Training SCINet ===")
    model = SCINet(
        seq_len=seq_len,
        pred_len=PRED_LEN,
        n_features=1,
        levels=3,
        hidden_dim=64,
    )
    return _train_sequence_model(model, X, y, epochs=50)


def train_tsmixer(X: torch.Tensor, y: torch.Tensor, seq_len: int, n_features: int) -> nn.Module:
    print("\n=== Training TSMixer ===")
    model = TSMixer(
        seq_len=seq_len,
        pred_len=PRED_LEN,
        n_features=n_features,
        n_layers=3,
        hidden_dim=128,
    )
    return _train_sequence_model(model, X, y, epochs=100)


def process_source(
    name: str,
    loader,
    path: Path,
    future_specs: Dict[str, Optional[tuple]],
    output_root: Path,
) -> None:
    print(f"\n=== Processing {name} dataset ===")
    df = clean_price_frame(loader(path))
    if df.empty:
        print(f"Skipping {name}: no valid records after cleaning.")
        return

    daily = aggregate_daily(df)
    mode_suffix = "with_size" if USE_SIZE_FEATURE else "price_only"
    source_dir = output_root / name / mode_suffix
    source_dir.mkdir(parents=True, exist_ok=True)
    output_csv = source_dir / "output.csv"
    daily.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"Saved daily averages to {output_csv}")

    total_points = len(daily)
    history_end_idx = total_points if FUTURE_ONLY_PLOT else max(0, total_points - PRED_LEN)
    history_start_idx = max(0, history_end_idx - HISTORY_DAYS)
    history_window = daily.iloc[history_start_idx:history_end_idx].copy()

    last_history_date = (
        history_window["timestamp"].iloc[-1]
        if not history_window.empty
        else daily["timestamp"].max()
    )

    future_window: Optional[pd.DataFrame] = None
    future_actual_prices: Optional[np.ndarray] = None
    future_spec = future_specs.get(name)
    if future_spec:
        fut_loader, fut_path = future_spec
        fut_path = Path(fut_path) if fut_path is not None else None
        if fut_path is not None and fut_path.exists():
            fut_df = clean_price_frame(fut_loader(fut_path))
            if not fut_df.empty:
                fut_daily = aggregate_daily(fut_df)
                future_window = fut_daily.head(PRED_LEN).copy()
                if len(future_window) < PRED_LEN:
                    start_date = (
                        future_window["timestamp"].iloc[-1] + pd.Timedelta(days=1)
                        if not future_window.empty
                        else (
                            pd.Timestamp.today().normalize()
                            if pd.isna(last_history_date)
                            else last_history_date + pd.Timedelta(days=1)
                        )
                    )
                    missing = PRED_LEN - len(future_window)
                    extra_dates = pd.date_range(start_date, periods=missing, freq="D")
                    future_window = pd.concat(
                        [future_window, pd.DataFrame({"timestamp": extra_dates})],
                        ignore_index=True,
                    )
                if "price_avg" in future_window.columns:
                    future_actual_prices = future_window["price_avg"].to_numpy(dtype=np.float32)
                else:
                    future_actual_prices = np.full(PRED_LEN, np.nan, dtype=np.float32)
        else:
            print(f"{name}: future data file not found; skipping future overlay.")

    if future_window is None:
        if FUTURE_ONLY_PLOT:
            start_date = (
                pd.Timestamp.today().normalize()
                if pd.isna(last_history_date)
                else last_history_date + pd.Timedelta(days=1)
            )
            future_dates = pd.date_range(start_date, periods=PRED_LEN, freq="D")
            future_window = pd.DataFrame({"timestamp": future_dates})
        else:
            future_start_idx = history_end_idx
            future_window = daily.iloc[future_start_idx:future_start_idx + PRED_LEN].copy()
            if len(future_window) < PRED_LEN:
                start_date = (
                    pd.Timestamp.today().normalize()
                    if pd.isna(last_history_date)
                    else last_history_date + pd.Timedelta(days=1)
                )
                missing = PRED_LEN - len(future_window)
                extra_dates = pd.date_range(start_date, periods=missing, freq="D")
                future_window = pd.concat(
                    [future_window, pd.DataFrame({"timestamp": extra_dates})],
                    ignore_index=True,
                )

    feature_cols = ["price_avg"]
    if USE_SIZE_FEATURE:
        if "size_avg" in daily.columns:
            feature_cols.append("size_avg")
        else:
            print(f"{name}: size feature requested but not available; using price only.")

    available_points = len(daily)
    max_seq_len = available_points - PRED_LEN - 1
    if max_seq_len <= 0:
        print(
            f"Skipping {name}: need at least {PRED_LEN + 2} days, "
            f"but only {available_points} available."
        )
        return

    seq_len = min(SEQ_LEN, max_seq_len)
    print(
        f"{name}: using sequence length {seq_len} (available days: {available_points})"
    )

    try:
        X_tensor, y_tensor, scaler, target_idx = prepare_tensors(
            daily, seq_len, PRED_LEN, feature_cols, "price_avg"
        )
    except ValueError as exc:
        print(f"Skipping {name}: {exc}")
        return

    true_normalized = y_tensor[-1].detach().cpu().numpy().flatten()
    true_values = denormalize_feature(true_normalized, scaler, target_idx)

    scoring_truth = future_actual_prices if future_actual_prices is not None else true_values
    scoring_truth = np.asarray(scoring_truth, dtype=np.float32)
    scoring_mask = ~np.isnan(scoring_truth)
    has_valid_scores = bool(scoring_mask.any())

    best_score = float("inf")
    best_pred_values: Optional[np.ndarray] = None
    best_model: Optional[nn.Module] = None
    n_features = X_tensor.size(-1)

    for trial in range(1, TSMIXER_TRIALS + 1):
        print(f"\n--- TSMixer trial {trial}/{TSMIXER_TRIALS} ---")
        model = train_tsmixer(X_tensor, y_tensor, seq_len, n_features)
        pred_norm = forecast(model, X_tensor)
        denorm_pred = denormalize_feature(pred_norm, scaler, target_idx)

        if has_valid_scores:
            mae = float(np.mean(np.abs(scoring_truth[scoring_mask] - denorm_pred[scoring_mask])))
            print(f"{name}: trial {trial} MAE = {mae:.2f} KRW")
        else:
            mae = float("inf")
            print(f"{name}: trial {trial} MAE unavailable (no ground truth)")

        if best_pred_values is None or mae < best_score:
            best_score = mae
            best_pred_values = denorm_pred
            best_model = model

    if best_pred_values is None or best_model is None:
        raise RuntimeError("TSMixer training did not produce any predictions.")

    model_path = source_dir / "tsmixer_model.pth"
    cpu_model = best_model.to(torch.device("cpu"))
    torch.save(cpu_model.state_dict(), model_path)
    best_model.to(DEVICE)
    if math.isfinite(best_score):
        print(f"Saved best TSMixer weights to {model_path} (MAE={best_score:.2f} KRW)")
    else:
        print(f"Saved best TSMixer weights to {model_path} (MAE unavailable).")

    future_pred_values = best_pred_values
    future_true_plot = None

    # Save tabular snapshot of actual vs. forecast for this horizon
    if future_actual_prices is not None:
        true_series_for_output = future_actual_prices
        future_true_plot = future_actual_prices
    elif FUTURE_ONLY_PLOT:
        true_series_for_output = np.full(PRED_LEN, np.nan, dtype=np.float32)
        future_true_plot = None
    else:
        true_series_for_output = true_values
        future_true_plot = true_values

    if future_true_plot is not None:
        mask = ~np.isnan(future_true_plot)
        if mask.any():
            mae = np.mean(np.abs(future_true_plot[mask] - future_pred_values[mask]))
            print(f"{name}: Forecast MAE = {mae:.2f} KRW")

    result_df = pd.DataFrame(
        {
            "horizon_day": np.arange(1, PRED_LEN + 1),
            "true_price": true_series_for_output,
            "tsmixer_price": future_pred_values,
        }
    )
    pred_csv = source_dir / f"predictions_h{PRED_LEN}.csv"
    result_df.to_csv(pred_csv, index=False, encoding="utf-8-sig")
    print(f"Saved prediction table to {pred_csv}")

    plot_path = source_dir / "forecast_plot.png"
    plot_history_and_forecast(
        history_window,
        future_window,
        future_true_plot,
        future_pred_values,
        plot_path,
    )


def plot_history_and_forecast(
    history_df: pd.DataFrame,
    future_df: pd.DataFrame,
    future_true: Optional[np.ndarray],
    future_pred: np.ndarray,
    plot_path: Path,
) -> None:
    plt.figure(figsize=(12, 6))

    if not history_df.empty:
        plt.plot(
            history_df["timestamp"],
            history_df["price_avg"],
            label=f"History ({len(history_df)}d actual)",
            color="tab:blue",
        )
        last_actual_date = history_df["timestamp"].iloc[-1]
        last_actual_price = history_df["price_avg"].iloc[-1]
    else:
        last_actual_date = None
        last_actual_price = None

    if future_true is not None:
        plt.plot(
            future_df["timestamp"],
            future_true,
            label="Future True",
            color="tab:green",
            linestyle="-",
            marker="o",
        )
    plt.plot(
        future_df["timestamp"],
        future_pred,
        label="TSMixer Forecast",
        color="tab:red",
        linestyle="--",
        marker="x",
    )

    if last_actual_date is not None:
        plt.axvline(last_actual_date, color="gray", linestyle=":", alpha=0.5)
        plt.annotate(
            "Forecast start",
            xy=(last_actual_date, last_actual_price),
            xytext=(10, 10),
            textcoords="offset points",
            fontsize=9,
            color="gray",
        )

    plt.title("Price History (30d) + 7d Forecast")
    plt.xlabel("Date")
    plt.ylabel("Price (KRW)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(plot_path, dpi=150)
    print(f"Saved visualization to {plot_path}")
    plt.close()


def parse_args():
    parser = argparse.ArgumentParser(description="Train TSMixer forecasts per data source.")
    parser.add_argument(
        "--sources",
        nargs="+",
        default=list(SOURCE_SPECS.keys()),
        help="Subset of data sources to process (default: all).",
    )
    parser.add_argument(
        "--pred-len",
        type=int,
        default=PRED_LEN,
        help="Prediction horizon (days ahead).",
    )
    parser.add_argument(
        "--seq-len",
        type=int,
        default=SEQ_LEN,
        help="Historical window length (days).",
    )
    parser.add_argument(
        "--history-days",
        type=int,
        default=HISTORY_DAYS,
        help="Number of past days to show on the visualization.",
    )
    parser.add_argument(
        "--future-only-plot",
        action="store_true",
        help="When set, show only forecasted values beyond the existing dataset (no future true curve).",
    )
    parser.add_argument(
        "--run-tag",
        help="Optional name for a subfolder under OutPut/. When omitted, results are written directly under OutPut/.",
    )
    parser.add_argument(
        "--custom-json",
        help="Path to a transaction dump JSON (with 'transactions' list) to use as the data source.",
    )
    parser.add_argument(
        "--auto-data",
        action="store_true",
        help="Automatically process every JSON file under the Data directory.",
    )
    parser.add_argument(
        "--future-json",
        help="Optional path to a future data JSON (list with price info) for the custom source.",
    )
    parser.add_argument(
        "--tsmixer-trials",
        type=int,
        default=TSMIXER_TRIALS,
        help="Number of independent TSMixer trainings (best MAE kept).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    global SEQ_LEN, PRED_LEN, HISTORY_DAYS, FUTURE_ONLY_PLOT, TSMIXER_TRIALS
    SEQ_LEN = args.seq_len
    PRED_LEN = args.pred_len
    HISTORY_DAYS = args.history_days
    FUTURE_ONLY_PLOT = args.future_only_plot
    TSMIXER_TRIALS = max(1, args.tsmixer_trials)

    run_tag = args.run_tag or datetime.now().strftime("run_%Y%m%d_%H%M%S")
    output_root = OUTPUT_DIR / run_tag
    output_root.mkdir(parents=True, exist_ok=True)

    source_specs = dict(SOURCE_SPECS)
    future_specs = dict(FUTURE_ACTUAL_SPECS)
    if args.custom_json:
        custom_path = Path(args.custom_json)
        source_specs["custom"] = (load_kream_transaction_dump, custom_path)
        if "custom" not in future_specs:
            future_specs["custom"] = None
        if args.future_json:
            future_specs["custom"] = (load_kream_future_data, Path(args.future_json))
        if "custom" not in args.sources:
            args.sources = ["custom"]

    def collect_auto_sources():
        auto_sources = []
        default_pairs = [
            ("forcedata", FORCEDATA_PATH),
            ("kream", KREAM_PATH),
            ("one_size", ONE_SIZE_PATH),
        ]
        for name, path in default_pairs:
            p = Path(path)
            if p.exists():
                auto_sources.append(name)
            else:
                print(f"{name}: default file missing at {p}, skipping.")
        for json_path in DATA_DIR.rglob("*.json"):
            if json_path in {FORCEDATA_PATH, KREAM_PATH, ONE_SIZE_PATH, KREAM_FUTURE_PATH}:
                continue
            source_name = _normalize_source_name(json_path.relative_to(DATA_DIR).as_posix())
            if source_name not in source_specs:
                source_specs[source_name] = (load_kream_transaction_dump, json_path)
            auto_sources.append(source_name)
        seen = set()
        deduped = []
        for name in auto_sources:
            if name not in seen:
                seen.add(name)
                deduped.append(name)
        return deduped or list(source_specs)

    default_files = {
        name: Path(path)
        for name, path in [
            ("forcedata", FORCEDATA_PATH),
            ("kream", KREAM_PATH),
            ("one_size", ONE_SIZE_PATH),
        ]
    }
    missing_defaults = [name for name, path in default_files.items() if not path.exists()]

    if args.auto_data or missing_defaults:
        if missing_defaults and not args.auto_data:
            print(
                f"Default sources missing {missing_defaults}; falling back to scanning all JSON under {DATA_DIR}."
            )
        args.sources = collect_auto_sources()
    else:
        auto_sources = []
        args.sources = [name for name, path in default_files.items() if path.exists()]

    print(
        f"Preparing datasets per source {args.sources} "
        f"(run_tag={run_tag}) "
        f"with seq_len={SEQ_LEN}, pred_len={PRED_LEN}, "
        f"history_days={HISTORY_DAYS}..."
    )
    final_sources = []
    for source_name in args.sources:
        if source_name not in source_specs:
            print(f"Unknown source '{source_name}', skipping.")
            continue
        loader, path = source_specs[source_name]
        try:
            _require_file(path)
        except FileNotFoundError:
            print(f"{source_name}: required file {path} missing, skipping.")
            continue
        final_sources.append(source_name)

    for source_name in final_sources:
        loader, path = source_specs[source_name]
        process_source(
            source_name,
            loader,
            path,
            future_specs,
            output_root,
        )


if __name__ == "__main__":
    main()
