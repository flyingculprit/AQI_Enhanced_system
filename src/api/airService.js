/**
 * Air Quality Service
 * Fetches data from AQICN and OpenWeather APIs and merges them
 */

const AQICN_BASE = 'https://api.waqi.info';
const AQICN_FEED = 'https://api.waqi.info/feed';
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * Get AQI data for a city by merging AQICN and OpenWeather APIs
 * @param {string} city - City name (e.g., "beijing", "london")
 * @returns {Promise<Object>} Merged AQI and weather data
 */
export async function getAQIData(city) {
  const aqicnKey = import.meta.env.VITE_AQICN_KEY;
  const owmKey = import.meta.env.VITE_OWM_KEY;

  if (!aqicnKey || !owmKey) {
    throw new Error('API keys are missing. Please check your .env file.');
  }

  let aqicnData = null;
  let owmWeatherData = null;
  let owmPollutionData = null;
  let coordinates = null;

  // Fetch AQICN data
  try {
    const aqicnUrl = `${AQICN_FEED}/${city}/?token=${aqicnKey}`;
    const aqicnResponse = await fetch(aqicnUrl);
    const aqicnJson = await aqicnResponse.json();
    console.log("aqicnJson", aqicnJson);
    if (aqicnJson.status === 'ok' && aqicnJson.data) {
      aqicnData = aqicnJson.data;
      // Extract coordinates from AQICN data
      if (aqicnData.city?.geo) {
        coordinates = {
          lat: aqicnData.city.geo[0],
          lon: aqicnData.city.geo[1],
        };
      }
    } else if (aqicnJson.status === 'error') {
      throw new Error(aqicnJson.data || 'Failed to fetch AQI data for this city');
    }
  } catch (error) {
    console.error('AQICN API error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error('Failed to fetch AQI data. Please check the city name and try again.');
  }

  // If we have coordinates, fetch OpenWeather data
  if (coordinates) {
    console.log("coordinates", coordinates);
    try {
      // Fetch current weather
      const weatherUrl = `${OWM_BASE}/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${owmKey}&units=metric`;
      const weatherResponse = await fetch(weatherUrl);
      owmWeatherData = await weatherResponse.json();
      console.log("owmWeatherData", owmWeatherData);
    } catch (error) {
      console.error('OpenWeather API error:', error);
    }

    try {
      // Fetch air pollution forecast
      const pollutionUrl = `${OWM_BASE}/air_pollution/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${owmKey}`;
      const pollutionResponse = await fetch(pollutionUrl);
      owmPollutionData = await pollutionResponse.json();
      console.log("ownm" ,owmPollutionData);
    } catch (error) {
      console.error('OpenWeather Pollution API error:', error);
    }
  }

  // Extract AQI data from AQICN
  const aqi = aqicnData?.aqi || null;
  const iaqi = aqicnData?.iaqi || {};
  const pm25 = iaqi?.pm25?.v || null;
  const pm10 = iaqi?.pm10?.v || null;
  const co = iaqi?.co?.v || null;
  const no2 = iaqi?.no2?.v || null;
  const so2 = iaqi?.so2?.v || null;
  const o3 = iaqi?.o3?.v || null;

  // Extract weather data from OpenWeather
  const temp = owmWeatherData?.main?.temp || null;
  const humidity = owmWeatherData?.main?.humidity || null;
  const wind = owmWeatherData?.wind?.speed || null;

  // Extract forecast for next hour
  let forecast_next_hour = null;
  if (owmPollutionData?.list && owmPollutionData.list.length > 0) {
    // Get the first forecast entry (closest to current time)
    const firstForecast = owmPollutionData.list[0];
    forecast_next_hour = firstForecast.main?.aqi || null;
  }

  // Build heatmap tile URL
  const heatmap_tile = `https://tiles.aqicn.org/tiles/{z}/{x}/{y}.png?token=${aqicnKey}`;

  return {
    city: aqicnData?.city?.name || city,
    aqi,
    pm25,
    pm10,
    co,
    no2,
    so2,
    o3,
    temp,
    humidity,
    wind,
    forecast_next_hour,
    heatmap_tile,
    coordinates,
  };
}

/**
 * Get nearby AQI stations within map bounds
 * @param {number} lat1 - Southwest latitude
 * @param {number} lng1 - Southwest longitude
 * @param {number} lat2 - Northeast latitude
 * @param {number} lng2 - Northeast longitude
 * @returns {Promise<Array>} Array of station data
 */
export async function getMapStations(lat1, lng1, lat2, lng2) {
  const aqicnKey = import.meta.env.VITE_AQICN_KEY;

  if (!aqicnKey) {
    throw new Error('AQICN API key is missing. Please check your .env file.');
  }

  try {
    // AQICN map bounds API
    const boundsUrl = `${AQICN_BASE}/map/bounds/?token=${aqicnKey}&latlng=${lat1},${lng1},${lat2},${lng2}`;
    const response = await fetch(boundsUrl);
    const data = await response.json();

    if (data.status === 'ok' && data.data) {
      // Transform the data to a more usable format
      const stations = data.data.map((station) => ({
        uid: station.uid,
        aqi: station.aqi,
        lat: station.lat,
        lon: station.lon,
        station: {
          name: station.station?.name || 'Unknown Station',
          time: station.station?.time,
        },
        iaqi: station.iaqi || {},
      }));

      return stations;
    }

    return [];
  } catch (error) {
    console.error('Error fetching map stations:', error);
    return [];
  }
}

/**
 * Search for AQI stations by keyword
 * @param {string} keyword - Search keyword (city name, etc.)
 * @returns {Promise<Array>} Array of station search results
 */
export async function searchStations(keyword) {
  const aqicnKey = import.meta.env.VITE_AQICN_KEY;

  if (!aqicnKey) {
    throw new Error('AQICN API key is missing. Please check your .env file.');
  }

  try {
    const searchUrl = `${AQICN_BASE}/search/?token=${aqicnKey}&keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === 'ok' && data.data) {
      return data.data.map((result) => ({
        uid: result.uid,
        name: result.station?.name || result.name || 'Unknown',
        aqi: result.aqi,
        lat: result.lat,
        lon: result.lon,
        time: result.time,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error searching stations:', error);
    return [];
  }
}

