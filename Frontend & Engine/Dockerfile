# /python-engine/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 8000

# Run the FastAPI server
CMD ["uvicorn", "main_api:app", "--host", "0.0.0.0", "--port", "8000"]