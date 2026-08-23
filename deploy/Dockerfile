FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml README.md ./
COPY src/ ./src/
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -e . && \
    pip install --no-cache-dir uvicorn[standard] gunicorn

# Create directories for models and cache
RUN mkdir -p /root/.inferforge/models /root/.cache

# Expose port
EXPOSE 11435

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:11435/health || exit 1

# Run the API server
CMD ["uvicorn", "inferforge.server.api:app", "--host", "0.0.0.0", "--port", "11435", "--workers", "4"]
