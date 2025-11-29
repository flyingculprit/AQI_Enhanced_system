import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAQIData, getMapStations } from '../api/airService';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import TreeRecommendations from '../components/TreeRecommendations';

// Fix Leaflet default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map bounds changes and fetch stations
function MapBoundsHandler({ onBoundsChange }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      onBoundsChange(sw.lat, sw.lng, ne.lat, ne.lng);
    },
  });
  return null;
}

// Component to fix map size after render
function MapSizeFixer() {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate map size after a short delay to ensure container is rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  // Also invalidate on window resize
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  
  return null;
}

function AQIDashboard() {
  const [city, setCity] = useState('');
  const [data, setData] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [error, setError] = useState(null);
  const [enhancedPrediction, setEnhancedPrediction] = useState(false);

  const handleSearch = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setStations([]);

    try {
      const result = await getAQIData(city.trim());
      setData(result);
      
      // Fetch nearby stations when we have coordinates
      if (result.coordinates) {
        fetchNearbyStations(result.coordinates.lat, result.coordinates.lon);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch AQI data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyStations = async (centerLat, centerLon) => {
    // Calculate bounds around the center point (approximately 0.5 degree radius)
    const lat1 = centerLat - 0.5;
    const lng1 = centerLon - 0.5;
    const lat2 = centerLat + 0.5;
    const lng2 = centerLon + 0.5;

    setLoadingStations(true);
    try {
      const stationData = await getMapStations(lat1, lng1, lat2, lng2);
      setStations(stationData);
    } catch (err) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  const handleMapBoundsChange = async (lat1, lng1, lat2, lng2) => {
    if (loadingStations) return;
    
    setLoadingStations(true);
    try {
      const stationData = await getMapStations(lat1, lng1, lat2, lng2);
      setStations(stationData);
    } catch (err) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (!aqi) return 'text-gray-400';
    if (aqi <= 50) return 'text-green-400';
    if (aqi <= 100) return 'text-yellow-400';
    if (aqi <= 150) return 'text-orange-400';
    if (aqi <= 200) return 'text-red-400';
    if (aqi <= 300) return 'text-purple-400';
    return 'text-red-500';
  };

  const getAQILabel = (aqi) => {
    if (!aqi) return 'N/A';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIBgColor = (aqi) => {
    if (!aqi) return '#6B7280';
    if (aqi <= 50) return '#10B981'; // green
    if (aqi <= 100) return '#F59E0B'; // yellow
    if (aqi <= 150) return '#F97316'; // orange
    if (aqi <= 200) return '#EF4444'; // red
    if (aqi <= 300) return '#8B5CF6'; // purple
    return '#7F1D1D'; // dark red
  };

  const getMarkerIcon = (aqi) => {
    const color = getAQIBgColor(aqi);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${aqi || 'N/A'}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Air Quality Dashboard
        </h1>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter city name (e.g., beijing, london, delhi)"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
            {/* Enhanced Prediction Toggle */}
            <div className="mt-4 flex items-center gap-3">
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
            {/* Main AQI Card */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                {data.city}
              </h2>
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${getAQIColor(data.aqi)}`}>
                  {data.aqi || 'N/A'}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-200">
                    {getAQILabel(data.aqi)}
                  </p>
                  <p className="text-gray-400">Air Quality Index</p>
                </div>
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

            {/* Map Section */}
            {data.coordinates && data.coordinates.lat && data.coordinates.lon && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Air Quality Heatmap
                  </h3>
                  {loadingStations && (
                    <span className="text-sm text-gray-400">Loading stations...</span>
                  )}
                  {!loadingStations && stations.length > 0 && (
                    <span className="text-sm text-gray-300">
                      {stations.length} station{stations.length !== 1 ? 's' : ''} found
                    </span>
                  )}
                </div>
                <div 
                  className="h-96 w-full rounded-lg overflow-hidden relative"
                  style={{ minHeight: '384px', position: 'relative' }}
                  id="map-container"
                >
                  <MapContainer
                    key={`${data.coordinates.lat}-${data.coordinates.lon}`}
                    center={[data.coordinates.lat, data.coordinates.lon]}
                    zoom={10}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                  >
                    {/* Base OpenStreetMap layer as fallback */}
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      maxZoom={19}
                      minZoom={1}
                    />
                    {/* AQICN Heatmap overlay */}
                    <TileLayer
                      url={data.heatmap_tile}
                      attribution='&copy; <a href="https://aqicn.org">AQICN</a>'
                      maxZoom={18}
                      minZoom={1}
                      opacity={0.7}
                    />
                    <MapSizeFixer />
                    <MapBoundsHandler onBoundsChange={handleMapBoundsChange} />
                    
                    {/* Main city marker */}
                    <Marker 
                      position={[data.coordinates.lat, data.coordinates.lon]}
                      icon={getMarkerIcon(data.aqi)}
                    >
                      <Popup>
                        <div>
                          <strong>{data.city}</strong>
                          <br />
                          AQI: {data.aqi || 'N/A'} - {getAQILabel(data.aqi)}
                          {data.pm25 && <><br />PM2.5: {data.pm25} μg/m³</>}
                          {data.pm10 && <><br />PM10: {data.pm10} μg/m³</>}
                        </div>
                      </Popup>
                    </Marker>

                    {/* Nearby stations markers */}
                    {stations.map((station) => (
                      <Marker
                        key={station.uid}
                        position={[station.lat, station.lon]}
                        icon={getMarkerIcon(station.aqi)}
                      >
                        <Popup>
                          <div>
                            <strong>{station.station?.name || 'Station'}</strong>
                            <br />
                            AQI: {station.aqi || 'N/A'} - {getAQILabel(station.aqi)}
                            {station.iaqi?.pm25?.v && (
                              <><br />PM2.5: {station.iaqi.pm25.v} μg/m³</>
                            )}
                            {station.iaqi?.pm10?.v && (
                              <><br />PM10: {station.iaqi.pm10.v} μg/m³</>
                            )}
                            {station.station?.time && (
                              <><br /><small>Updated: {new Date(station.station.time).toLocaleString()}</small></>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* AI Tree Planting Recommendations */}
            <TreeRecommendations aqiData={data} enabled={enhancedPrediction} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AQIDashboard;

