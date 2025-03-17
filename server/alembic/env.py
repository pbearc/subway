from logging.config import fileConfig

import os
import sys

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

from sqlalchemy import engine_from_config, pool
from dotenv import load_dotenv

from config import DB_CONFIG
from server.db.models import Base

from alembic import context

# Load environment variables
load_dotenv()

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def get_url():
    """
    Prioritize environment variables, fall back to DB_CONFIG if not set
    """
    # Try environment variables first
    db_user = os.getenv('DB_USER', DB_CONFIG.get('user'))
    db_password = os.getenv('DB_PASSWORD', DB_CONFIG.get('password'))
    db_host = os.getenv('DB_HOST', DB_CONFIG.get('host', 'localhost'))
    db_port = os.getenv('DB_PORT', str(DB_CONFIG.get('port', '5432')))
    db_name = os.getenv('DB_NAME', DB_CONFIG.get('dbname'))
    
    # Validate that all required parameters are present
    if not all([db_user, db_password, db_host, db_port, db_name]):
        raise ValueError("Missing database configuration. Check environment variables or DB_CONFIG.")
    
    return f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'

# Override the sqlalchemy.url 
url = get_url()
config.set_main_option('sqlalchemy.url', url)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Create configuration dictionary dynamically
    configuration = config.get_section(config.config_ini_section, {}) or {}
    configuration['sqlalchemy.url'] = url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()