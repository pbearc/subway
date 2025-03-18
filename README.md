# Subway Outlet Finder

An interactive web application to find and explore Subway restaurant outlets across Kuala Lumpur and surrounding areas.

## Demo

![Demo Video](./assets/demo.gif)

This application is deployed on [Render](https://render.com) and can be accessed at:

- Frontend: [https://subway-outlets-frontend.onrender.com](https://subway-outlets-frontend.onrender.com)
- Backend API: [https://subway-outlets-api-qg8w.onrender.com](https://subway-outlets-api-qg8w.onrender.com)

## Features

- Interactive map showing all Subway outlets
- Search functionality to find outlets by name or location
- Detailed information for each outlet including operating hours
- Find nearby outlets based on user location
- AI-powered chatbot to answer questions about outlets

## Technical Stack

### Frontend

- React: Frontend library for building the user interface
- Google Maps API: For map visualization and location services
- Axios: HTTP client for API requests
- Tailwind CSS: Utility-first CSS framework for styling
- React Router: Client-side routing
- Context API: State management
- Custom Hooks: For reusable logic

### Backend

- FastAPI: Web framework for building APIs
- SQLAlchemy: SQL toolkit and Object-Relational Mapper
- PostgreSQL: Relational database for data storage
- Google Gemini API: For natural language processing in the chatbot
- Selenium: Web automation for scraping outlet data
- Uvicorn: ASGI server for serving the FastAPI application
- Alembic: Database migration tool

## Local Setup Instructions

### Prerequisites

- Python 3.8+ installed
- Node.js and npm installed
- PostgreSQL installed and running
- Google Maps API key
- Google Gemini API key

### Database Setup

1. Create a PostgreSQL database:

```
createdb subway
```

2. Set up your database user or use the default user

## Backend Setup

1. Clone the repository:

```
git clone https://github.com/yourusername/subway-outlet-finder.git
cd subway-outlet-finder
```

2. Create and activate a virtual environment:

```
python -m venv subway_outlet_venv
# On Windows
subway_outlet_venv\Scripts\activate
# On macOS/Linux
source subway_outlet_venv/bin/activate
```

3. Install backend dependencies:

```
pip install -r requirements.txt
```

4. Create a .env file in the server directory with the following:

```
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subway
GEMINI_API_KEY=your_gemini_api_key
```

5. Start the backend server:

```
cd .. # back to subway_outlet directory
uvicorn server.api.main:app --reload
```

The backend will be available at http://localhost:8000.

## Frontend Setup

1. Navigate to the client directory:

```
cd client
```

2. Install frontend dependencies:

```
npm install
```

3. Create a .env file in the client directory with:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Start the frontend development server:

```
npm start
```

The frontend will be available at http://localhost:3000.

## Project Structure

```
subway-outlet/
├── client/ # Frontend React application
│ ├── public/ # Static files
│ └── src/ # Source code
│ ├── components/ # UI components
│ ├── hooks/ # Custom React hooks
│ ├── services/ # API service functions
│ └── context/ # React context providers
│
├── server/ # Backend FastAPI application
│ ├── alembic/ # For data migration
│ ├── api/ # API endpoints
│ │ ├── endpoints/ # API route handlers
│ │ ├── models/ # Models for database tables
│ │ └── main.py # FastAPI app initialization
│ ├── chatbot/ # Chatbot implementation
│ ├── db/ # Database models and manager
│ └── scrape/ # Web scraping functionality
│
├── config.py # Configuration settings
├── alembic.ini # Alembic configuration file
└── requirements.txt # Python dependencies
```
