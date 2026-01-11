import { useState, useEffect, useRef } from 'react';
import { getTreePlantingRecommendations } from '../api/aiService';
import { formatRupees } from '../utils/currency';
import Loader from './Loader';
import ErrorBox from './ErrorBox';
import AQIPredictionGraph from './AQIPredictionGraph';

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
    hasFetchedRef.current = false;
    setLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const data = await getTreePlantingRecommendations(aqiData);
      setRecommendations(data);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err.message || 'Failed to fetch AI recommendations');
      hasFetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (!enabled || !aqiData || aqiData.aqi === null) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mt-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">🤖</span>
          Enhanced Prediction
        </h2>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <ErrorBox message={error} />}
      {loading && <Loader />}

      {recommendations && !loading && (
        <div className="space-y-8">
          {/* Summary */}
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">AI Summary</h3>
            <p className="text-gray-200 leading-relaxed">{recommendations.summary}</p>
          </div>

          {/* Hourly Prediction Graph */}
          <AQIPredictionGraph data={recommendations.hourlyForecast} />

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600 hover:border-blue-500/50 transition-colors shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🌲</span>
                <h3 className="font-medium text-gray-400 text-xs uppercase tracking-wide">Trees Needed</h3>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                {recommendations.recommendations?.numberOfTrees || 'N/A'}
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600 hover:border-blue-500/50 transition-colors shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💰</span>
                <h3 className="font-medium text-gray-400 text-xs uppercase tracking-wide">Investment</h3>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                {formatRupees(recommendations.recommendations?.investmentAmount)}
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600 hover:border-blue-500/50 transition-colors shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📈</span>
                <h3 className="font-medium text-gray-400 text-xs uppercase tracking-wide">ROI Timeframe</h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {recommendations.recommendations?.roi?.timeframe || 'N/A'}
              </p>
            </div>
          </div>

          {/* Tree Types */}
          {recommendations.recommendations?.treeTypes && (
            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
                Recommended Tree Species
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommendations.treeTypes.map((tree, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium"
                  >
                    {tree}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Carbon Analysis */}
          {recommendations.recommendations?.carbonAnalysis && (
            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
              <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wide flex items-center gap-2">
                <span>🌍</span> Carbon Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Annual CO₂ Sequestration</p>
                  <p className="text-xl font-bold text-blue-400">
                    {recommendations.recommendations.carbonAnalysis.annualCarbonSequestration} <span className="text-sm text-gray-400 font-normal">tons/year</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Lifetime CO₂ Sequestration</p>
                  <p className="text-xl font-bold text-blue-400">
                    {recommendations.recommendations.carbonAnalysis.lifetimeCarbonSequestration} <span className="text-sm text-gray-400 font-normal">tons</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Air Pollution Reduction</p>
                  <p className="text-xl font-bold text-blue-400">
                    {recommendations.recommendations.carbonAnalysis.airPollutionReduction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Human Impact */}
          {recommendations.recommendations?.humanImpact && (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-5">
              <h3 className="font-semibold text-blue-400 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span> Human Impact Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Health Benefits</p>
                  <p className="text-gray-200 text-sm leading-relaxed">{recommendations.recommendations.humanImpact.healthBenefit}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Economic & Social Value</p>
                  <p className="text-gray-200 text-sm leading-relaxed">{recommendations.recommendations.humanImpact.economicBenefit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Before/After Comparison */}
          {recommendations.recommendations?.comparison && (
            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
              <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wide flex items-center gap-2">
                <span>📊</span> Before & After Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h4 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wide">Before Planting</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400 text-sm">AQI</span>
                      <span className="font-bold text-gray-300 text-lg">
                        {recommendations.recommendations.comparison.before.aqi}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400 text-sm">PM2.5</span>
                      <span className="font-semibold text-gray-200">
                        {recommendations.recommendations.comparison.before.pm25} <span className="text-xs text-gray-500">μg/m³</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400 text-sm">PM10</span>
                      <span className="font-semibold text-gray-200">
                        {recommendations.recommendations.comparison.before.pm10} <span className="text-xs text-gray-500">μg/m³</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-500/20">
                  <h4 className="font-semibold text-blue-400 mb-4 text-sm uppercase tracking-wide">After 5 Years</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400 text-sm">AQI</span>
                      <span className="font-bold text-blue-400 text-lg">
                        {recommendations.recommendations.comparison.after.aqi}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400 text-sm">PM2.5</span>
                      <span className="font-semibold text-blue-400">
                        {recommendations.recommendations.comparison.after.pm25}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400 text-sm">PM10</span>
                      <span className="font-semibold text-blue-400">
                        {recommendations.recommendations.comparison.after.pm10}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-600">
                <div className="inline-block bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-lg">
                  <span className="text-xs text-gray-400 mr-2 uppercase tracking-wide">Expected Improvement</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {recommendations.recommendations.comparison.improvement}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Implementation Plan */}
          {recommendations.recommendations?.implementation && (
            <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <span>📅</span> Implementation Plan
              </h3>
              <div className="space-y-3 mb-4">
                {recommendations.recommendations.implementation.phases?.map((phase, index) => (
                  <div key={index} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                    <span className="text-blue-400 font-bold text-lg min-w-[24px]">{index + 1}.</span>
                    <p className="text-gray-200 text-sm leading-relaxed">{phase}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Timeline</span>
                  <span className="font-semibold text-gray-200">
                    {recommendations.recommendations.implementation.timeline}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Annual Maintenance</span>
                  <span className="font-semibold text-blue-400">
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
