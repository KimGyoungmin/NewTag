FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CHROME_HEADLESS=true \
    CHROME_TYPE=chromium

WORKDIR /app

# 필수 패키지 및 Chromium/드라이버 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        chromium \
        chromium-driver \
        ca-certificates \
        fonts-liberation \
        libnss3 \
        libxss1 \
        libappindicator3-1 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        curl \
        unzip && \
    rm -rf /var/lib/apt/lists/*

# 파이썬 의존성 (model/requirements.txt)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# 크롤링 스크립트 복사 (model/crawling/*)
COPY crawling/ /app/

CMD ["bash"]
