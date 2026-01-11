import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AQIPredictionGraph = ({ data }) => {
    if (!data || data.length === 0) return null;

    const getAQIColor = (aqi) => {
        if (aqi <= 50) return '#10B981'; // Green
        if (aqi <= 100) return '#F59E0B'; // Yellow
        if (aqi <= 150) return '#F97316'; // Orange
        if (aqi <= 200) return '#EF4444'; // Red
        if (aqi <= 300) return '#8B5CF6'; // Purple
        return '#7F1D1D'; // Dark Red
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const aqiValue = payload[0].value;
            const level = payload[0].payload.level;
            return (
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl backdrop-blur-md bg-opacity-90">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getAQIColor(aqiValue) }}
                        ></span>
                        <p className="text-white font-bold text-lg">AQI {aqiValue}</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: getAQIColor(aqiValue) }}>{level}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm mb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-blue-400">📊</span>
                        Next 5 Hours Prediction
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">AI-powered air quality forecasting</p>
                </div>
                <div className="flex gap-4 text-[10px] text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Good
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Poor
                    </div>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#374151"
                            opacity={0.5}
                        />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10 }}
                            domain={[0, (dataMax) => Math.max(150, dataMax + 50)]}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="aqi"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAqi)"
                            animationDuration={1500}
                            dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#1F2937' }}
                            activeDot={{ r: 6, fill: '#60A5FA', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AQIPredictionGraph;
