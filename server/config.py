import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the same directory as this file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Database configuration
DB_CONFIG = {
    "dbname": os.environ.get('DB_NAME', 'subway'),
    "user": os.environ.get('DB_USER', 'postgres'),
    "password": os.environ.get('DB_PASSWORD', ''),  # Default empty for security
    "host": os.environ.get('DB_HOST', 'localhost'),
    "port": int(os.environ.get('DB_PORT', 5432))
}

HF_API_TOKEN = os.environ.get('HUGGINGFACE_API_TOKEN', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Scraper configuration
SCRAPER_CONFIG = {
    "url": "https://subway.com.my/find-a-subway",
    "search_term": "Kuala Lumpur"
}