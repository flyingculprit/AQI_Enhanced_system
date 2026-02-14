import { useState, useEffect } from 'react';
import { getLiveSensorData } from '../api/airService';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import TreeRecommendations from '../components/TreeRecommendations';

function LiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enhancedPrediction, setEnhancedPrediction] = useState(false);
  const [esp32Ip, setEsp32Ip] = useState('');

  // Load ESP32 IP from localStorage on mount
  useEffect(() => {
    const savedIp = localStorage.getItem('ESP32_IP_ADDRESS') || '10.34.122.160';
    setEsp32Ip(savedIp);
  }, []);

  // Fetch live data on mount
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const sensorData = await getLiveSensorData();
      setData(sensorData);
    } catch (err) {
      setError(err.message || 'Failed to fetch live sensor data. Please check ESP32 IP in /setup.');
    } finally {
      setLoading(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (!aqi) return 'text-gray-400';
    if (aqi <= 50) return 'text-green-500';
    if (aqi <= 100) return 'text-yellow-500';
    if (aqi <= 150) return 'text-orange-500';
    if (aqi <= 200) return 'text-red-500';
    if (aqi <= 300) return 'text-purple-500';
    return 'text-red-800';
  };

  const getAQILabel = (aqi) => {
    if (!aqi) return 'N/A';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">
            Live Sensor Dashboard
          </h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Live Mode Indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <p className="text-sm text-green-300 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              Live Mode Active - Displaying real-time MQ135 sensor data from ESP32 ({esp32Ip})
            </p>
          </div>
        </div>

        {/* Enhanced Prediction Toggle */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhancedPrediction}
                  onChange={(e) => setEnhancedPrediction(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enhancedPrediction ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enhancedPrediction ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-300">
                  🤖 Enhanced Prediction
                </span>
              </label>
              <span className="text-xs text-gray-400">
                (AI-powered tree planting recommendations)
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorBox message={error} />}

        {/* Loading State */}
        {loading && <Loader />}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-6">
            {/* AQI Display */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700 text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                {data.city || 'Live Sensor Location'}
              </h2>
              <div className="mb-4">
                <p className="text-gray-400 mb-2">Current AQI</p>
                <p className={`text-6xl font-bold ${getAQIColor(data.aqi)}`}>
                  {data.aqi || 'N/A'}
                </p>
                <p className="text-xl text-gray-300 mt-2">
                  {getAQILabel(data.aqi)}
                </p>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pollutants Card */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Pollutants
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">PM2.5:</span>
                    <span className="font-semibold text-gray-200">{data.pm25 || 'N/A'} μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PM10:</span>
                    <span className="font-semibold text-gray-200">{data.pm10 || 'N/A'} μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CO:</span>
                    <span className="font-semibold text-gray-200">{data.co || 'N/A'} μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">NO₂:</span>
                    <span className="font-semibold text-gray-200">{data.no2 || 'N/A'} μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SO₂:</span>
                    <span className="font-semibold text-gray-200">{data.so2 || 'N/A'} μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">O₃:</span>
                    <span className="font-semibold text-gray-200">{data.o3 || 'N/A'} μg/m³</span>
                  </div>
                </div>
              </div>

              {/* Weather Card */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Weather
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Temperature:</span>
                    <span className="font-semibold text-gray-200">
                      {data.temp !== null ? `${data.temp}°C` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Humidity:</span>
                    <span className="font-semibold text-gray-200">
                      {data.humidity !== null ? `${data.humidity}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wind Speed:</span>
                    <span className="font-semibold text-gray-200">
                      {data.wind !== null ? `${data.wind} m/s` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Forecast Card */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Forecast
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 mb-2">Next Hour AQI:</p>
                    <p className={`text-3xl font-bold ${getAQIColor(data.forecast_next_hour)}`}>
                      {data.forecast_next_hour !== null
                        ? data.forecast_next_hour
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {data.forecast_next_hour !== null
                        ? getAQILabel(data.forecast_next_hour)
                        : 'No forecast available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Tree Planting Recommendations */}
            <TreeRecommendations 
              aqiData={data} 
              enabled={enhancedPrediction} 
              mode="sensor"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveDashboard;
