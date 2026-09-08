# ==============================================================================
# EasyFlashcard Backend Dockerfile
# Multi-stage optimized build using uv for Python 3.11
# ==============================================================================

FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

# Set working directory
WORKDIR /app

# Configure uv and Python environment
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install dependencies first for layer caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Copy application source code and metadata
COPY app ./app
COPY README.md ./

# Install the application package into the virtual environment
RUN uv sync --frozen --no-dev

# Add virtual environment binaries to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose backend service port
EXPOSE 8000

# Healthcheck endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c 'import urllib.request; urllib.request.urlopen("http://localhost:8000/health").read()' || exit 1


# Start Uvicorn ASGI server (dynamically respects Cloud Run's $PORT or defaults to 8000)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
