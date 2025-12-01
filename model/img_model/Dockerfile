# Stage 1: Create a virtual environment and install dependencies
FROM python:3.9-slim AS builder

WORKDIR /app

# Install and upgrade pip
RUN pip install --upgrade pip

# Copy requirements and install them
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Run the application
FROM python:3.9-slim

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache /wheels/*

# Copy the application source code
COPY . .

# Expose port 8000
EXPOSE 8000

# Run the application with uvicorn
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
