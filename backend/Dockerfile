FROM python:3.10-slim

# Install git and system packages (required for some libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Environment variables placeholders (will be overridden in Render deployment)
ENV GROK_API_KEY=""
ENV WEATHERAPI_KEY=""

# Download sentence-transformer model and build vector database index at build time
RUN python rag/build_index.py

EXPOSE 8000

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
