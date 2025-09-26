FROM python:3.11-slim

WORKDIR /app

COPY embedding-service/app.py /app/app.py

RUN pip install --no-cache-dir fastapi==0.115.0 uvicorn[standard]==0.30.6 pydantic==2.9.2 requests==2.32.3

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

