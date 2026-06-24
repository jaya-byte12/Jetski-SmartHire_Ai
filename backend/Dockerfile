# Use official light-weight Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies if any are needed (e.g. gcc for some python packages, though pip wheels cover most)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port 8080 (standard for GCP Cloud Run)
EXPOSE 8080

# Run FastAPI backend using uvicorn with 4 workers for production efficiency
CMD ["uvicorn", "main.py:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
