import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Activity, Download } from 'lucide-react';
import DynamicSignalDashboard from '../components/DynamicSignalDashboard';

export default function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;

    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true); // Default behavior for images/videos without playback events if needed

    if (!result) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No results available</h2>
                <button
                    onClick={() => navigate('/')}
                    className="text-indigo-600 hover:underline inline-flex items-center space-x-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Go back to upload</span>
                </button>
            </div>
        );
    }

    const { vehicle_counts, lane_counts, lane_densities } = result;

    return (
        <div className="max-w-6xl mx-auto py-24 px-4 relative z-0">
            {/* Decorative background blobs */}
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8">
                <Link to="/" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center space-x-2 transition-colors group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Upload</span>
                </Link>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    <span className="gradient-text">Analysis Dashboard</span>
                </h1>
                <div className="w-24"></div> {/* Spacer for centering */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Media Preview & Overlay */}
                <div className="lg:col-span-2 relative bg-black/80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center min-h-[400px] group backdrop-blur-xl">
                    {result.result_url ? (
                        result.file_type === 'video' ? (
                            <video
                                src={result.result_url}
                                controls
                                className="w-full h-full object-contain max-h-[600px]"
                                autoPlay
                                muted
                                loop
                                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                        ) : (
                            <img src={result.result_url} alt="Analyzed Traffic" className="w-full h-full object-contain max-h-[600px]" />
                        )
                    ) : (
                        <div className="text-gray-500">Image/Video not available</div>
                    )}

                    {/* Removed Dashboard overlay from here */}
                </div>

                {/* Global Stats */}
                <div className="flex flex-col space-y-6">
                    <div className="glass-card rounded-2xl p-8 relative overflow-hidden group/card hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover/card:bg-indigo-500/20 transition-colors"></div>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center space-x-2 uppercase tracking-wider">
                            <Activity className="h-4 w-4 text-indigo-500" />
                            <span>System Load</span>
                        </h3>
                        <div className="mt-4 flex items-end">
                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tighter">
                                {result.density_percentage.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                            Total Vehicles Detected: <span className="font-bold text-gray-900 dark:text-white text-lg ml-1">{result.vehicle_count}</span>
                        </p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Cars', count: vehicle_counts.car, color: 'text-blue-500' },
                            { label: 'Trucks', count: vehicle_counts.truck, color: 'text-amber-500' },
                            { label: 'Buses', count: vehicle_counts.bus, color: 'text-emerald-500' },
                            { label: 'Motors', count: vehicle_counts.motorcycle, color: 'text-purple-500' }
                        ].map(v => (
                            <div key={v.label} className="p-4 bg-white/40 dark:bg-gray-800/40 border border-white/20 dark:border-white/5 rounded-xl text-center hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{v.label}</p>
                                <p className={`text-3xl font-black ${v.color} drop-shadow-sm`}>{v.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Smart Dashboard Integration (Full width) */}
            {result.time_series_data && (
                <DynamicSignalDashboard
                    timeSeriesData={result.time_series_data}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    compact={false}
                />
            )}

            {/* Direction Stats */}
            <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Approach Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {Object.entries(lane_counts).map(([laneName, count]) => {
                        const density = lane_densities[laneName];
                        const getDensityColor = (d) => {
                            if (d > 75) return 'bg-red-500';
                            if (d > 50) return 'bg-orange-500';
                            return 'bg-green-500';
                        };

                        return (
                            <div key={laneName} className="flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{laneName}</span>
                                    <span className="text-sm text-gray-500">{count} vehicles</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full ${getDensityColor(density)} transition-all duration-1000 ease-out`} style={{ width: `${density}%` }}></div>
                                </div>
                                <div className="text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    {density.toFixed(1)}% Load
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legacy mobile integration removed, dashboard is fully responsive now */}

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-12">
                <a
                    href={`http://localhost:8000/api/analysis/${result.id}/report/csv/`}
                    download
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium"
                >
                    <Download className="h-4 w-4" />
                    <span>Export Data</span>
                </a>
                <button
                    onClick={() => navigate('/history')}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/25 font-bold"
                >
                    <Clock className="h-4 w-4" />
                    <span>View History</span>
                </button>
            </div>

        </div>
    );
}
