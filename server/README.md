# Subway Outlet Finder - Backend

This is the backend component of the Subway Outlet Finder application, providing a robust API for accessing Subway restaurant outlet data across Kuala Lumpur and surrounding areas.

## Features

- **RESTful API endpoints** for Subway outlet data
- **Database operations** using SQLAlchemy ORM
- **AI-powered chatbot** functionality using Google Gemini API
- **Automatic data collection** via web scraping
- **Geospatial queries** for finding nearby outlets
- **Detailed operating hours** information

## Architecture

The backend follows a **layered architecture** pattern:

1. **API Layer**: FastAPI endpoints handling HTTP requests and responses.
2. **Business Logic Layer**: Service components implementing core functionality.
3. **Data Access Layer**: Database interaction through SQLAlchemy ORM.
4. **External Integration Layer**: Gemini API integration and web scraping.

## Database Structure

The database consists of two main tables: `outlets` and `operating_hours`. Below is the schema:

### `outlets` Table

| Column                | Type                     | Description                                                                  |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `id`                  | `integer`                | Primary key, auto-incremented.                                               |
| `name`                | `character varying(255)` | Unique name of the outlet.                                                   |
| `address`             | `text`                   | Address of the outlet.                                                       |
| `waze_link`           | `character varying(500)` | Waze navigation link for the outlet.                                         |
| `latitude`            | `double precision`       | Latitude coordinate of the outlet.                                           |
| `longitude`           | `double precision`       | Longitude coordinate of the outlet.                                          |
| `created_at`          | `timestamp`              | Timestamp when the outlet was added. Defaults to `CURRENT_TIMESTAMP`.        |
| `updated_at`          | `timestamp`              | Timestamp when the outlet was last updated. Defaults to `CURRENT_TIMESTAMP`. |
| `raw_operating_hours` | `text`                   | Raw operating hours data (unprocessed).                                      |

**Indexes**:

- Primary key: `id`
- Unique constraint: `name`

---

### `operating_hours` Table

| Column         | Type                     | Description                                                         |
| -------------- | ------------------------ | ------------------------------------------------------------------- |
| `id`           | `integer`                | Primary key, auto-incremented.                                      |
| `outlet_id`    | `integer`                | Foreign key referencing `outlets.id` (with `ON DELETE CASCADE`).    |
| `day_of_week`  | `character varying(20)`  | Day of the week (e.g., "Monday").                                   |
| `opening_time` | `time without time zone` | Opening time of the outlet for the day.                             |
| `closing_time` | `time without time zone` | Closing time of the outlet for the day.                             |
| `is_closed`    | `boolean`                | Indicates if the outlet is closed for the day. Defaults to `false`. |

**Indexes**:

- Primary key: `id`
- Foreign key: `outlet_id` references `outlets.id` (with `ON DELETE CASCADE`).

## Key Technical Decisions

### FastAPI Framework

**Choice**: FastAPI  
**Reasoning**:

- **Automatic Documentation**: Generates Swagger documentation out of the box.
- **Performance**: Built on ASGI, enabling asynchronous request handling for better performance.
- **Type Safety**: Native support for Python type hints and Pydantic models.
- **Modern Features**: Includes dependency injection, background tasks, and WebSocket support.

### SQLAlchemy ORM

**Choice**: SQLAlchemy with PostgreSQL.  
**Reasoning**:

- **Flexibility**: Supports both ORM and raw SQL queries.
- **Database Agnostic**: Works with multiple databases, allowing future migration if needed.
- **Transaction Management**: Ensures data integrity during complex operations.
- **Connection Pooling**: Improves performance by reusing database connections.

### PostgreSQL Database

**Choice**: PostgreSQL over alternatives like MySQL or MongoDB.  
**Reasoning**:

- **Geospatial Support**: Essential for location-based queries (e.g., finding nearby outlets).
- **ACID Compliance**: Ensures data reliability and integrity.
- **Scalability**: Handles large datasets and complex queries efficiently.

### Google Gemini API

**Choice**: Google Gemini for the AI chatbot.  
**Reasoning**:

- **Cost-Effectiveness**: Provides a generous free tier of tokens.
- **Speed**: Runs on Google’s infrastructure, eliminating the need for local GPU resources.
- **Natural Language Understanding**: Generates accurate SQL queries from natural language questions.

### Selenium Web Scraping

**Choice**: Selenium over alternatives like Beautiful Soup.  
**Reasoning**:

- **Dynamic Content**: Handles JavaScript-rendered websites.
- **Automation**: Simulates browser interactions for complex scraping tasks.

## Initialization Process

When the `main.py` file is executed, the following steps occur:

1. **FastAPI App Initialization**:

   - The FastAPI app is created, and CORS middleware is added to allow requests from specified origins (e.g., `http://localhost:3000`).

2. **Database Initialization**:

   - Database tables are created if they don’t already exist using `Base.metadata.create_all(db_manager.engine)`.
   - If no data is found, the scraper (`scrape_subway_outlets`) is triggered to collect and save data.

3. **Chatbot Initialization**:

   - The chatbot is initialized using `initialize_chatbot()`, setting up the Gemini API.

4. **API Endpoints**:
   - Routers for `outlet` and `chatbot` endpoints are included, handling requests related to Subway outlets and chatbot interactions.

## API Endpoints

### Outlet Endpoints

| Endpoint                               | Method | Description                                               |
| -------------------------------------- | ------ | --------------------------------------------------------- |
| `/outlets`                             | GET    | Retrieve all outlets with their operating hours.          |
| `/outlets/{outlet_id}`                 | GET    | Retrieve details of a specific outlet by ID.              |
| `/outlets/search`                      | GET    | Search outlets by name or address.                        |
| `/outlets/nearby`                      | GET    | Find outlets within a certain radius of a given location. |
| `/outlets/{outlet_id}/operating-hours` | GET    | Retrieve operating hours for a specific outlet.           |

### Chatbot Endpoints

| Endpoint                        | Method | Description                           |
| ------------------------------- | ------ | ------------------------------------- |
| `/chatbot/initialize`           | GET    | Initialize the chatbot system.        |
| `/chatbot/query`                | GET    | Query the chatbot with a question.    |
| `/chatbot/history/{session_id}` | GET    | Retrieve chat history for a session.  |
| `/chatbot/session/{session_id}` | DELETE | Delete a specific chat session.       |
| `/chatbot/maintenance/cleanup`  | GET    | Clean up old sessions to free memory. |
| `/chatbot/status`               | GET    | Get the status of the chatbot system. |

## Chatbot Features

1. **SQL Query Generation**:

   - Converts natural language questions into SQL queries using Gemini.

2. **Session-Based Memory**:

   - Maintains conversation history per session for context-aware responses.

3. **Response Generation**:

   - Generates natural language responses based on query results.

4. **Safety Checks**:

   - Ensures only safe `SELECT` queries are executed.

5. **Caching**:

   - Caches frequently asked questions to improve performance.

6. **Relevant Outlet Extraction**:
   - Extracts relevant outlets from query results for display on a map.

## Deployment

The backend is deployed on **Render** as a Web Service, with automatic deployments from the `main` branch. The PostgreSQL database is hosted as a **Render PostgreSQL** service.

## Project Structure

```
server/
├── alembic/ # Database migration scripts
│ ├── versions/ # Migration version files
│ └── env.py # Migration environment configuration
├── api/ # API endpoints
│ ├── endpoints/ # API route handlers
│ │ ├── outlet.py # Outlet-related endpoints (e.g., search, nearby outlets)
│ │ └── chatbot.py # Chatbot-related endpoints (e.g., query, session management)
│ ├── models/ # Pydantic models for API responses
│ │ ├── base.py # Base model for shared attributes
│ │ └── outlet.py # Outlet-specific response models
│ └── main.py # FastAPI app initialization and configuration
├── chatbot/ # Chatbot implementation
│ └── gemini_sql_chatbot.py # SQL-based chatbot using Google Gemini API
├── db/ # Database models and manager
│ ├── models.py # SQLAlchemy models for database tables
│ └── db_manager.py # Database connection and session management
├── scrape/ # Web scraping functionality
│ ├── main_scraper.py # Main scraper script for collecting outlet data
│ ├── geocoding.py # Utilities for geocoding addresses
│ ├── process_operating_hours.py # Script for processing operating hours data
│ └── update_operating_hours.py # Script for updating operating hours without rescraping
├── config.py # Configuration settings (e.g., database credentials, API keys)
├── alembic.ini # Alembic configuration file for database migrations
└── requirements.txt # Python dependencies for the backend
```
