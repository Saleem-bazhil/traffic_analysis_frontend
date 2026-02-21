import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Calendar, Activity, ChevronLeft, ChevronRight, FileImage, FileVideo } from 'lucide-react';
import client from '../api/client';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = async (pageUrl = `/api/analysis/?page=${page}`) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get(pageUrl);
            setHistory(response.data.results);

            // Calculate total pages based on count and page size (default 12)
            setTotalPages(Math.ceil(response.data.count / 12));
        } catch (err) {
            setError('Failed to fetch history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [page]);

    if (loading && history.length === 0) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mr-3" />
                <span className="text-gray-500 text-lg">Loading history...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-24 px-4 relative z-0 min-h-screen">
            {/* Decorative background blobs */}
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    <span className="gradient-text">Analysis History</span>
                </h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {history.length === 0 ? (
                <div className="text-center py-24 glass-panel rounded-3xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    <Activity className="w-16 h-16 mx-auto text-indigo-300 dark:text-indigo-800/50 mb-6" />
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-xl font-light">No analysis data found.</p>
                    <Link to="/" className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/25 font-bold">
                        <span>Upload Media</span>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {history.map((item) => (
                            <Link
                                to={`/analysis/${item.id}`}
                                key={item.id}
                                className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden flex items-center justify-center">
                                    {item.result_url ? (
                                        item.file_type === 'video' ? (
                                            <video src={item.result_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <img src={item.result_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.filename} />
                                        )
                                    ) : (
                                        <div className="text-gray-400">Media not found</div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center shadow-sm">
                                        {item.file_type === 'video' ? <FileVideo className="w-3 w-3 mr-1" /> : <FileImage className="w-3 h-3 mr-1" />}
                                        <span className="capitalize">{item.file_type}</span>
                                    </div>
                                </div>

                                <div className="p-5 flex-grow flex flex-col">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate mb-2 lg:text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.filename}</h3>
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-2">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(item.processed_at).toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-widest font-bold">System Load</span>
                                            <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                                {item.density_percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-widest font-bold">Vehicles</span>
                                            <span className="text-base font-extrabold text-gray-700 dark:text-gray-200">
                                                {item.vehicle_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-12 flex justify-center items-center space-x-6 glass-panel py-3 px-6 rounded-full w-max mx-auto">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm disabled:shadow-none"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-widest uppercase">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm disabled:shadow-none"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
