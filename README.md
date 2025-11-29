# AQI Frontend

A modern Air Quality Index (AQI) dashboard with AI-powered tree planting recommendations, built with Vite, React, Tailwind CSS, and Google Gemini AI.

## Features

- 🔐 User authentication with Supabase (Login & Sign Up)
- 🌍 Real-time AQI data from multiple sources (AQICN & OpenWeather)
- 🗺️ Interactive map with heatmap tiles and station markers
- 🤖 AI-powered tree planting recommendations using Google Gemini
- 📊 Comprehensive analysis including:
  - Investment amount and ROI
  - Number of trees needed
  - Carbon sequestration analysis
  - Before/after air quality comparison
- 📈 Weather data integration
- 🔍 Multi-station monitoring

## Getting Started

### Prerequisites

You'll need API keys for:
- **Supabase** (for authentication) - Required
- AQICN API (for air quality data)
- OpenWeather API (for weather and pollution forecast)
- Google Gemini API (for AI recommendations)

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Required for authentication)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Other API Keys
VITE_AQICN_KEY=your_aqicn_api_key_here
VITE_OWM_KEY=your_openweather_api_key_here
VITE_GEMINI_KEY=your_gemini_api_key_here
```

**How to get API keys:**
- **Supabase** (Required): 
  1. Go to [supabase.com](https://supabase.com) and create a free account
  2. Create a new project
  3. Go to Project Settings → API
  4. Copy your Project URL and anon/public key
  5. Enable Email authentication in Authentication → Providers
- **AQICN**: Register at [aqicn.org](https://aqicn.org/api/)
- **OpenWeather**: Sign up at [openweathermap.org](https://openweathermap.org/api)
- **Gemini**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Tech Stack

- **Vite** - Next generation frontend tooling
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service for authentication
- **Leaflet** - Interactive maps
- **Google Gemini AI** - AI-powered recommendations
- **React Router** - Client-side routing

## Project Structure

```
src/
├── api/
│   ├── airService.js      # AQI and weather data fetching
│   └── aiService.js        # Gemini AI integration
├── components/
│   ├── ErrorBox.jsx       # Error display component
│   ├── Loader.jsx         # Loading spinner
│   ├── ProtectedRoute.jsx # Route protection component
│   └── TreeRecommendations.jsx  # AI recommendations display
├── contexts/
│   └── AuthContext.jsx    # Authentication context provider
├── lib/
│   └── supabase.js        # Supabase client configuration
├── pages/
│   ├── AQIDashboard.jsx   # Main dashboard page (protected)
│   ├── Login.jsx          # Login page
│   └── SignUp.jsx         # Sign up page
└── App.jsx                # Root component with routing
```

## Usage

1. **Sign Up/Login**: Create an account or sign in to access the dashboard
2. Enter a city name in the search box (e.g., "beijing", "london", "delhi")
3. View real-time AQI data, pollutants, and weather information
4. Explore the interactive map with nearby monitoring stations
5. Scroll down to see AI-powered tree planting recommendations
6. Review investment analysis, ROI, and carbon impact projections

