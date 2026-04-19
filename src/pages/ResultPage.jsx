import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Download, Activity, Car, PieChart as PieChartIcon, BarChart3, Compass } from 'lucide-react';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import DynamicSignalDashboard from '../components/DynamicSignalDashboard';

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip
);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#cbd5f5',
                font: {
                    weight: '700',
                },
            },
        },
    },
    scales: {
        x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(148, 163, 184, 0.12)' },
        },
        y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(148, 163, 184, 0.12)' },
        },
    },
};

const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: '#cbd5f5',
                padding: 18,
                font: {
                    weight: '700',
                },
            },
        },
    },
};

export default function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;

    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

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

    const directionBarData = {
        labels: Object.keys(lane_counts),
        datasets: [
            {
                label: 'Vehicles by Direction',
                data: Object.values(lane_counts),
                backgroundColor: ['#34d399', '#f87171', '#60a5fa', '#fbbf24'],
                borderRadius: 14,
            },
        ],
    };

    const vehiclePieData = {
        labels: ['Cars', 'Trucks', 'Buses', 'Motors'],
        datasets: [
            {
                data: [
                    vehicle_counts.car || 0,
                    vehicle_counts.truck || 0,
                    vehicle_counts.bus || 0,
                    vehicle_counts.motorcycle || 0,
                ],
                backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
                borderColor: ['#0f172a'],
                borderWidth: 3,
            },
        ],
    };

    const timeSeries = result.time_series_data || [];
    const trafficTrendData = {
        labels: timeSeries.map((entry) => `${Math.round(entry.timestamp)}s`),
        datasets: [
            {
                label: 'System Load %',
                data: timeSeries.map((entry) => Number(entry.density || 0).toFixed(1)),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.18)',
                fill: true,
                tension: 0.35,
            },
        ],
    };

    const summaryCards = [
        {
            title: 'System Load',
            value: `${result.density_percentage.toFixed(1)}%`,
            icon: Activity,
            accent: 'text-violet-300',
        },
        {
            title: 'Total Vehicles',
            value: result.vehicle_count,
            icon: Car,
            accent: 'text-cyan-300',
        },
        {
            title: 'Directions',
            value: 'North South East West',
            icon: Compass,
            accent: 'text-emerald-300',
        },
    ];

    return (
        <div className="max-w-6xl mx-auto py-24 px-4 relative z-0">
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
                <div className="w-24"></div>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-xl mb-8">
                <div className="relative bg-black/80 flex items-center justify-center min-h-[360px]">
                    {result.result_url ? (
                        result.file_type === 'video' ? (
                            <video
                                src={result.result_url}
                                controls
                                className="w-full h-full object-contain max-h-[640px]"
                                autoPlay
                                muted
                                loop
                                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                        ) : (
                            <img src={result.result_url} alt="Analyzed Traffic" className="w-full h-full object-contain max-h-[640px]" />
                        )
                    ) : (
                        <div className="text-gray-500">Image/Video not available</div>
                    )}
                </div>
            </div>

            {result.time_series_data && (
                <DynamicSignalDashboard
                    timeSeriesData={result.time_series_data}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    compact={false}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {summaryCards.map((item) => (
                    <div key={item.title} className="glass-card rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">{item.title}</p>
                            <item.icon className={`h-5 w-5 ${item.accent}`} />
                        </div>
                        <p className={`text-3xl font-black ${item.accent}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <div className="xl:col-span-2 glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Traffic Graph</h3>
                    </div>
                    <div className="h-[320px]">
                        <Line data={trafficTrendData} options={chartOptions} />
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <PieChartIcon className="h-5 w-5 text-pink-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Pie Chart</h3>
                    </div>
                    <div className="h-[320px]">
                        <Pie data={vehiclePieData} options={pieOptions} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <Compass className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Direction Breakdown</h3>
                    </div>
                    <div className="h-[300px]">
                        <Bar data={directionBarData} options={chartOptions} />
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Counts and Load</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {[
                            { label: 'Cars', value: vehicle_counts.car, accent: 'text-blue-400' },
                            { label: 'Trucks', value: vehicle_counts.truck, accent: 'text-red-400' },
                            { label: 'Buses', value: vehicle_counts.bus, accent: 'text-emerald-400' },
                            { label: 'Motors', value: vehicle_counts.motorcycle, accent: 'text-amber-400' },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400 mb-2">{item.label}</p>
                                <p className={`text-3xl font-black ${item.accent}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {Object.entries(lane_counts).map(([laneName, count]) => {
                            const density = lane_densities[laneName] || 0;
                            return (
                                <div key={laneName}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{laneName}</span>
                                        <span className="text-sm text-gray-400">{count} vehicles • {density.toFixed(1)}% load</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-slate-800/70 overflow-hidden">
                                        <div
                                            className={`${density > 75 ? 'bg-red-500' : density > 50 ? 'bg-amber-400' : 'bg-emerald-500'} h-full rounded-full transition-all duration-700`}
                                            style={{ width: `${density}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

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
