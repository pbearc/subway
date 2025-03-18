# Subway Outlet Finder - Frontend

This is the frontend component of the Subway Outlet Finder application, providing an interactive user interface for exploring Subway restaurant outlets.

## Features

- **Interactive Map**: Visualizes all Subway outlets with markers and info windows.
- **Detailed Outlet Information**: Displays operating hours, address, and navigation links.
- **Location-Based Search**: Finds nearby outlets using geolocation.
- **Keyword Search**: Allows users to search for outlets by name or address.
- **AI-Powered Chatbot**: Provides natural language query support for finding outlets.
- **Responsive Design**: Works on both mobile and desktop devices.

## Architecture

The frontend follows a **component-based architecture** using React:

1. **UI Components**: Reusable building blocks for the interface.
2. **Custom Hooks**: Encapsulated logic for data fetching and state management.
3. **Context Providers**: Global state management for application data.
4. **Services**: Handles API integration and external service communication.

## Key Technical Decisions

### React Framework

**Choice**: React using functional components and hooks.  
**Reasoning**:

- **Component-Based Architecture**: Encourages reusability and maintainability.
- **Virtual DOM**: Ensures efficient UI updates.
- **Large Ecosystem**: Access to a wide range of libraries and community support.

### Google Maps Integration

**Choice**: Google Maps API over alternatives like Mapbox or Leaflet.  
**Reasoning**:

- **Global Coverage**: Comprehensive map data, particularly important for Malaysia.
- **Familiar Interface**: Most users are already accustomed to Google Maps.
- **Rich Features**: Includes markers, info windows, and geocoding.

### Tailwind CSS

**Choice**: Tailwind CSS over alternatives like Bootstrap or Material UI.  
**Reasoning**:

- **Utility-First Approach**: Enables rapid UI development.
- **Customizability**: Highly configurable without overriding pre-built components.
- **Smaller Bundle Size**: Purges unused styles for optimized performance.

### Axios

**Choice**: Axios over the Fetch API.  
**Reasoning**:

- **Automatic JSON Transformation**: Simplifies data handling.
- **Interceptors**: Allows global request/response handling.
- **Request Cancellation**: Supports cancellation of ongoing requests.

### React Router

**Choice**: React Router for client-side routing.  
**Reasoning**:

- **Declarative Routing**: Integrates seamlessly with React.
- **Nested Routes**: Supports complex UI structures.
- **Programmatic Navigation**: Enables dynamic navigation.

### Context API

**Choice**: React Context API for state management.  
**Reasoning**:

- **Built-In**: No additional dependencies required.
- **Avoids Prop Drilling**: Reduces the need to pass props through multiple components.
- **Custom Hooks Integration**: Works well with custom hooks for state management.

## Project Structure

```
client/
├── public/ # Static files
│ ├── index.html # HTML entry point for the React app
│ └── assets/ # Static assets like images, fonts, etc.
└── src/ # Source code
├── components/ # UI components
│ ├── map/ # Map-related components
│ │ ├── MarkerInfoWindow.jsx # Component for displaying marker info on the map
│ │ └── OutletMap.jsx # Main map component for displaying Subway outlets
│ ├── outlet/ # Outlet information components
│ │ ├── IntersectingOutlets.jsx # Component for displaying intersecting outlets
│ │ ├── OperatingHours.jsx # Component for displaying outlet operating hours
│ │ └── OutletDetails.jsx # Component for detailed outlet information
│ ├── chatbot/ # Chatbot components
│ │ ├── ChatBot.jsx # Main chatbot component
│ │ ├── ChatMessage.jsx # Component for individual chat messages
│ │ └── SuggestionPills.jsx # Component for displaying quick suggestions in the chatbot
│ ├── layout/ # Layout components
│ │ ├── Header.jsx # Header component for the application
│ │ └── HeaderSearchFilter.jsx # Search and filter component in the header
│ └── common/ # Reusable UI components
│ ├── Button.jsx # Reusable button component
│ ├── Icon.jsx # Reusable icon component
│ ├── Loader.jsx # Loading spinner component
│ └── StatusIndicator.jsx # Component for displaying status indicators
├── hooks/ # Custom React hooks
│ ├── useOutlets.js # Hook for fetching and managing outlet data
│ ├── useChatMessages.js # Hook for managing chatbot message state
│ ├── useClickOutside.js # Hook for detecting clicks outside a component
│ ├── useSuggestions.js # Hook for managing chatbot suggestions
│ └── useSearch.js # Hook for handling search functionality
├── services/ # API service functions
│ └── api.js # Functions for making API requests to the backend
├── context/ # React context providers
│ └── GoogleMapsContext.js # Context for managing Google Maps state
├── styles/ # Global styles
│ └── index.css # Global CSS styles for the application
├── utils/ # Utility functions
│ ├── distanceCalculator.js # Utility for calculating distances between coordinates
│ └── formatter.js # Utility for formatting data (e.g., dates, times)
├── App.js # Main application component (root component)
└── index.js # JavaScript entry point for the React app
```
