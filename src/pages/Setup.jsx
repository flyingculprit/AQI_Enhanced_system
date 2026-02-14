import { useState, useEffect } from 'react';

function Setup() {
  const [ipAddress, setIpAddress] = useState('');
  const [savedIp, setSavedIp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    // Load saved IP on mount
    const saved = localStorage.getItem('ESP32_IP_ADDRESS') || '10.34.122.160';
    setSavedIp(saved);
    setIpAddress(saved);
  }, []);

  const validateIP = (ip) => {
    // Basic IP validation regex
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const handleSave = () => {
    if (!ipAddress.trim()) {
      setMessage('Please enter an IP address');
      setMessageType('error');
      return;
    }

    if (!validateIP(ipAddress.trim())) {
      setMessage('Invalid IP address format. Please enter a valid IP (e.g., 192.168.1.100)');
      setMessageType('error');
      return;
    }

    try {
      localStorage.setItem('ESP32_IP_ADDRESS', ipAddress.trim());
      setSavedIp(ipAddress.trim());
      setMessage('ESP32 IP address saved successfully!');
      setMessageType('success');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      setMessage('Failed to save IP address. Please try again.');
      setMessageType('error');
    }
  };

  const handleTest = async () => {
    if (!ipAddress.trim() || !validateIP(ipAddress.trim())) {
      setMessage('Please enter a valid IP address first');
      setMessageType('error');
      return;
    }

    setMessage('Testing connection...');
    setMessageType('');

    try {
      const testUrl = `http://${ipAddress.trim()}/aqi-data`;
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && typeof data.aqiValue !== 'undefined') {
        setMessage(`Connection successful! Sensor AQI: ${data.aqiValue}`);
        setMessageType('success');
      } else {
        setMessage('Connection successful but invalid data format received');
        setMessageType('error');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessage('Connection timeout. Please check the IP address and ensure ESP32 is reachable.');
      } else {
        setMessage(`Connection failed: ${error.message}`);
      }
      setMessageType('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            ESP32 Setup
          </h1>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ESP32 IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 10.34.122.160"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-sm text-gray-400">
                Enter the IP address of your ESP32 device. Default: 10.34.122.160
              </p>
            </div>

            {savedIp && (
              <div className="mb-6 p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Currently Saved IP:</p>
                <p className="text-lg font-semibold text-white">{savedIp}</p>
              </div>
            )}

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  messageType === 'success'
                    ? 'bg-green-900/50 border border-green-700 text-green-300'
                    : messageType === 'error'
                    ? 'bg-red-900/50 border border-red-700 text-red-300'
                    : 'bg-blue-900/50 border border-blue-700 text-blue-300'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save IP Address
              </button>
              <button
                onClick={handleTest}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Test Connection
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Instructions:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Enter the IP address of your ESP32 device running the MQ135 sensor</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The IP address will be saved in your browser's localStorage</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use "Test Connection" to verify the ESP32 is reachable and responding</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The ESP32 should expose an endpoint at <code className="bg-gray-700 px-1 rounded">/aqi-data</code> that returns <code className="bg-gray-700 px-1 rounded">{"{aqiValue: number}"}</code></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;
