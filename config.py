import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_CONFIG = {
    "dbname": os.environ.get('DB_NAME', 'subway'),
    "user": os.environ.get('DB_USER', 'postgres'),
    "password": os.environ.get('DB_PASSWORD', ''),  # Default empty for security
    "host": os.environ.get('DB_HOST', 'localhost'),
    "port": int(os.environ.get('DB_PORT', 5432))
}

# Scraper configuration
SCRAPER_CONFIG = {
    "url": "https://subway.com.my/find-a-subway",
    "search_term": "Kuala Lumpur"
}