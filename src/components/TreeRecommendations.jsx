import { useState, useEffect, useRef } from 'react';
import { getTreePlantingRecommendations } from '../api/aiService';
import { formatRupees } from '../utils/currency';
import Loader from './Loader';
import ErrorBox from './ErrorBox';

function TreeRecommendations({ aqiData, enabled }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  const lastAqiDataRef = useRef(null);

  useEffect(() => {
    // Only fetch if enabled, has data, and hasn't been fetched for this data yet
    if (enabled && aqiData && aqiData.aqi !== null) {
      // Check if this is new data (different city or AQI changed significantly)
      const dataKey = `${aqiData.city}-${aqiData.aqi}`;
      if (lastAqiDataRef.current !== dataKey) {
        hasFetchedRef.current = false;
        lastAqiDataRef.current = dataKey;
      }
      
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        // Call fetchRecommendations directly
        const fetchData = async () => {
          setLoading(true);
          setError(null);
          setRecommendations(null);

          try {
            const data = await getTreePlantingRecommendations(aqiData);
            setRecommendations(data);
          } catch (err) {
            setError(err.message || 'Failed to fetch AI recommendations');
            hasFetchedRef.current = false; // Allow retry on error
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    } else if (!enabled) {
      // Reset when disabled
      setRecommendations(null);
      hasFetchedRef.current = false;
      lastAqiDataRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aqiData?.city, aqiData?.aqi, enabled]);

  const fetchRecommendations = async () => {
    // Reset ref to allow fetching again
    hasFetchedRef.current = false;
    setLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const data = await getTreePlantingRecommendations(aqiData);
      setRecommendations(data);
      hasFetchedRef.current = true; // Mark as fetched
    } catch (err) {
      setError(err.message || 'Failed to fetch AI recommendations');
      hasFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  if (!enabled || !aqiData || aqiData.aqi === null) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🤖 Enhanced Prediction
        </h2>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <ErrorBox message={error} />}
      {loading && <Loader />}

      {recommendations && !loading && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700">{recommendations.summary}</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Number of Trees */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🌲</span>
                <h3 className="font-semibold text-gray-800">Trees Needed</h3>
              </div>
              <p className="text-3xl font-bold text-green-700">
                {recommendations.recommendations?.numberOfTrees || 'N/A'}
              </p>
            </div>

            {/* Investment */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="font-semibold text-gray-800">Investment</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-700">
                {formatRupees(recommendations.recommendations?.investmentAmount)}
              </p>
            </div>

            {/* ROI Timeframe */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📈</span>
                <h3 className="font-semibold text-gray-800">ROI Timeframe</h3>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {recommendations.recommendations?.roi?.timeframe || 'N/A'}
              </p>
            </div>
          </div>

          {/* Tree Types */}
          {recommendations.recommendations?.treeTypes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Recommended Tree Species
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommendations.treeTypes.map((tree, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {tree}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Carbon Analysis */}
          {recommendations.recommendations?.carbonAnalysis && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-5 border border-green-200">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                🌍 Carbon Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Annual CO₂ Sequestration</p>
                  <p className="text-xl font-bold text-green-700">
                    {recommendations.recommendations.carbonAnalysis.annualCarbonSequestration} tons/year
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lifetime CO₂ Sequestration</p>
                  <p className="text-xl font-bold text-blue-700">
                    {recommendations.recommendations.carbonAnalysis.lifetimeCarbonSequestration} tons
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Air Pollution Reduction</p>
                  <p className="text-xl font-bold text-purple-700">
                    {recommendations.recommendations.carbonAnalysis.airPollutionReduction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Before/After Comparison */}
          {recommendations.recommendations?.comparison && (
            <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-lg p-5 border-2 border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                📊 Before & After Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                  <h4 className="font-semibold text-red-700 mb-3">Before Planting</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">AQI:</span>
                      <span className="font-bold text-red-600">
                        {recommendations.recommendations.comparison.before.aqi}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PM2.5:</span>
                      <span className="font-semibold">
                        {recommendations.recommendations.comparison.before.pm25} μg/m³
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PM10:</span>
                      <span className="font-semibold">
                        {recommendations.recommendations.comparison.before.pm10} μg/m³
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {recommendations.recommendations.comparison.before.description}
                    </p>
                  </div>
                </div>

                {/* After */}
                <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                  <h4 className="font-semibold text-green-700 mb-3">After 5 Years</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">AQI:</span>
                      <span className="font-bold text-green-600">
                        {recommendations.recommendations.comparison.after.aqi}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PM2.5:</span>
                      <span className="font-semibold text-green-600">
                        {recommendations.recommendations.comparison.after.pm25}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PM10:</span>
                      <span className="font-semibold text-green-600">
                        {recommendations.recommendations.comparison.after.pm10}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {recommendations.recommendations.comparison.after.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Improvement Percentage */}
              <div className="mt-4 text-center">
                <div className="inline-block bg-green-100 px-6 py-3 rounded-lg">
                  <span className="text-sm text-gray-600 mr-2">Expected Improvement:</span>
                  <span className="text-2xl font-bold text-green-700">
                    {recommendations.recommendations.comparison.improvement}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ROI Benefits */}
          {recommendations.recommendations?.roi && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="font-semibold text-gray-800 mb-2">💡 ROI Benefits</h3>
              <p className="text-gray-700">
                {recommendations.recommendations.roi.benefits}
              </p>
            </div>
          )}

          {/* Implementation Plan */}
          {recommendations.recommendations?.implementation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                📅 Implementation Plan
              </h3>
              <div className="space-y-2 mb-3">
                {recommendations.recommendations.implementation.phases?.map((phase, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">{index + 1}.</span>
                    <p className="text-gray-700">{phase}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div>
                  <span className="text-sm text-gray-600">Timeline: </span>
                  <span className="font-semibold">
                    {recommendations.recommendations.implementation.timeline}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Annual Maintenance: </span>
                  <span className="font-semibold text-green-700">
                    {formatRupees(recommendations.recommendations.implementation.maintenance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TreeRecommendations;

