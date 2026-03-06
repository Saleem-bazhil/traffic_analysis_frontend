import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Calendar, Activity } from 'lucide-react';
import client from '../api/client';
import DynamicSignalDashboard from '../components/DynamicSignalDashboard';

export default function AnalysisDetailPage() {
    const { id } = useParams();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await client.get(`/api/analysis/${id}/`);
                setAnalysis(response.data);
            } catch (err) {
                setError('Failed to fetch analysis details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mr-3" />
                <span className="text-gray-500 text-lg">Loading details...</span>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error || 'Analysis not found'}</h2>
                <Link to="/history" className="text-indigo-600 hover:underline inline-flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to history</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-24 px-4 relative z-0">
            {/* Decorative background blobs */}
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="mb-8 flex items-center justify-between">
                <Link to="/history" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center space-x-2 transition-colors group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to History</span>
                </Link>
                <div className="flex items-center text-sm text-gray-400 dark:text-gray-500 space-x-2 font-medium bg-gray-100/50 dark:bg-gray-800/50 py-1.5 px-3 rounded-full">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(analysis.processed_at).toLocaleString()}</span>
                </div>
            </div>

            <div className="glass-card rounded-3xl p-8 lg:p-10 shadow-xl border border-white/20 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
                    <span className="gradient-text">{analysis.filename}</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 relative bg-black/80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center min-h-[400px] group backdrop-blur-xl">
                        {analysis.result_url ? (
                            analysis.file_type === 'video' ? (
                                <video
                                    src={analysis.result_url}
                                    controls
                                    className="w-full h-full object-contain max-h-[400px]"
                                    autoPlay
                                    muted
                                    loop
                                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />
                            ) : (
                                <img src={analysis.result_url} alt="Result" className="w-full h-full object-contain max-h-[400px]" />
                            )
                        ) : (
                            <span className="text-gray-500">No media available</span>
                        )}

                        {/* Removed Floating Signal Dashboard Overlay */}
                    </div>

                    <div className="flex flex-col space-y-6">
                        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group/card hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover/card:bg-indigo-500/20 transition-colors"></div>
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center space-x-2 uppercase tracking-wider">
                                <Activity className="h-4 w-4 text-indigo-500" />
                                <span>System Load</span>
                            </h3>
                            <div className="mt-4 flex items-end">
                                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tighter">
                                    {analysis.density_percentage.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                                Total Vehicles Detected: <span className="font-bold text-gray-900 dark:text-white text-lg ml-1">{analysis.vehicle_count}</span>
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-6 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Cars', count: analysis.vehicle_counts.car, color: 'text-blue-500' },
                                { label: 'Trucks', count: analysis.vehicle_counts.truck, color: 'text-amber-500' },
                                { label: 'Buses', count: analysis.vehicle_counts.bus, color: 'text-emerald-500' },
                                { label: 'Motors', count: analysis.vehicle_counts.motorcycle, color: 'text-purple-500' }
                            ].map(v => (
                                <div key={v.label} className="p-4 bg-white/40 dark:bg-gray-800/40 border border-white/20 dark:border-white/5 rounded-xl text-center hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{v.label}</p>
                                    <p className={`text-3xl font-black ${v.color} drop-shadow-sm`}>{v.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Smart Dashboard Integration */}
                {analysis.time_series_data && (
                    <DynamicSignalDashboard
                        timeSeriesData={analysis.time_series_data}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        compact={false}
                    />
                )}

                <div className="flex justify-end pt-8 mt-4 border-t border-gray-200 dark:border-gray-800/50">
                    <a
                        href={`http://localhost:8000/api/analysis/${analysis.id}/report/csv/`}
                        download
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/25 font-bold"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export CSV Report</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
