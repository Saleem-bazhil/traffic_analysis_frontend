import React, { useState, useEffect, useRef } from 'react';
import { Settings, Hand, Cpu, Activity, Zap } from 'lucide-react';

// Green durations (seconds) for low/medium/high traffic
const GREEN_DURATION_LOW = 10;
const GREEN_DURATION_MED = 20;
const GREEN_DURATION_HIGH = 35;

// Sequence of active phases (North vs South, East vs West)
const PHASE_SEQUENCE = ['NS', 'EW'];
const PHASE_NAMES = {
    'NS': 'North & South Axis',
    'EW': 'East & West Axis'
};

// Helper to determine duration based on density
const assignGreenDuration = (density) => {
    let d = Math.max(0, Math.min(100, density));
    let secs = Math.round(GREEN_DURATION_LOW + (d / 100) * (GREEN_DURATION_HIGH - GREEN_DURATION_LOW));
    return secs;
};

export default function DynamicSignalDashboard({ timeSeriesData, currentTime = 0, isPlaying = false, compact = false }) {
    const [currentStats, setCurrentStats] = useState(null);

    // Smart Controller State
    const [activePhase, setActivePhase] = useState('NS');
    const [lightState, setLightState] = useState('GREEN'); // GREEN, YELLOW, RED
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Manual Mode State
    const [isManualMode, setIsManualMode] = useState(false);
    const [pendingPhase, setPendingPhase] = useState(null);

    const timeRemainingRef = useRef(timeRemaining);
    const activePhaseRef = useRef(activePhase);
    const lightStateRef = useRef(lightState);
    const laneDensitiesRef = useRef({});
    const laneCountsRef = useRef({});
    const isManualModeRef = useRef(isManualMode);
    const pendingPhaseRef = useRef(pendingPhase);

    useEffect(() => {
        timeRemainingRef.current = timeRemaining;
        activePhaseRef.current = activePhase;
        lightStateRef.current = lightState;
        isManualModeRef.current = isManualMode;
        pendingPhaseRef.current = pendingPhase;
    }, [timeRemaining, activePhase, lightState, isManualMode, pendingPhase]);

    // Fast lookup for current time in timeSeriesData
    useEffect(() => {
        if (!timeSeriesData || timeSeriesData.length === 0) return;

        let closest = timeSeriesData[0];
        for (let i = 0; i < timeSeriesData.length; i++) {
            if (timeSeriesData[i].timestamp <= currentTime) {
                closest = timeSeriesData[i];
            } else {
                break;
            }
        }
        setCurrentStats(closest);
        if (closest && closest.lane_densities) {
            laneDensitiesRef.current = closest.lane_densities;
            laneCountsRef.current = closest.lane_counts || { North: 0, South: 0, East: 0, West: 0 };
        }

    }, [timeSeriesData, currentTime]);

    // Determines the max density relevant to a specific phase to calculate its duration
    const getPhaseDensity = (phase, densities) => {
        if (!densities || Object.keys(densities).length === 0) return 0;
        if (phase === 'NS') {
            return Math.max(densities.North || 0, densities.South || 0);
        }
        if (phase === 'EW') {
            return Math.max(densities.East || 0, densities.West || 0);
        }
        return 0;
    };

    // The main signal loop
    useEffect(() => {
        const interval = setInterval(() => {
            let tr = timeRemainingRef.current;
            let ls = lightStateRef.current;
            let currentPhase = activePhaseRef.current;
            let manualMode = isManualModeRef.current;
            let pPhase = pendingPhaseRef.current;

            // Intialize on startup
            if (tr === 0 && ls === 'GREEN' && !manualMode) {
                const densities = laneDensitiesRef.current;
                if (Object.keys(densities).length > 0) {
                    const duration = assignGreenDuration(getPhaseDensity('NS', densities));
                    setActivePhase('NS');
                    setTimeRemaining(Math.max(duration, GREEN_DURATION_LOW));
                    setLightState('GREEN');
                }
                return;
            }

            if (manualMode) {
                if (pPhase && ls === 'GREEN') {
                    if (pPhase !== currentPhase) {
                        setLightState('YELLOW');
                        setTimeRemaining(4);
                    } else {
                        setPendingPhase(null);
                    }
                } else if (ls === 'YELLOW') {
                    if (tr > 1) {
                        setTimeRemaining(p => p - 1);
                    } else {
                        setLightState('RED');
                        setTimeRemaining(3);
                    }
                } else if (ls === 'RED') {
                    if (tr > 1) {
                        setTimeRemaining(p => p - 1);
                    } else {
                        let nextPhase = pPhase || (currentPhase === 'NS' ? 'EW' : 'NS');
                        setActivePhase(nextPhase);
                        setLightState('GREEN');
                        setTimeRemaining(0); // 0 = infinite in manual
                        setPendingPhase(null);
                    }
                }
            } else {
                if (!isPlaying) return;

                if (tr > 1) {
                    setTimeRemaining(p => p - 1);
                } else {
                    if (ls === 'GREEN') {
                        setLightState('YELLOW');
                        setTimeRemaining(4);
                    } else if (ls === 'YELLOW') {
                        setLightState('RED');
                        setTimeRemaining(3);
                    } else if (ls === 'RED') {
                        const nextPhase = currentPhase === 'NS' ? 'EW' : 'NS';
                        setActivePhase(nextPhase);
                        setLightState('GREEN');
                        const nextDuration = assignGreenDuration(getPhaseDensity(nextPhase, laneDensitiesRef.current));
                        setTimeRemaining(Math.max(nextDuration, GREEN_DURATION_LOW));
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    const toggleMode = () => {
        setIsManualMode(!isManualMode);
        if (isManualMode && lightState === 'GREEN') {
            const newDuration = assignGreenDuration(getPhaseDensity(activePhase, laneDensitiesRef.current));
            setTimeRemaining(Math.max(newDuration, GREEN_DURATION_LOW));
            setPendingPhase(null);
        }
    };

    const handleManualSwitch = (targetPhase) => {
        if (!isManualMode) return;
        if (activePhase === targetPhase && lightState === 'GREEN' && pendingPhase !== targetPhase) return;
        setPendingPhase(targetPhase);
    };

    if (!timeSeriesData || timeSeriesData.length === 0) {
        return (
            <div className={`glass-card rounded-2xl p-6 mt-6 flex flex-col items-center justify-center ${compact ? 'min-h-[100px] max-w-sm' : 'min-h-[200px]'}`}>
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Initializing Intersection Engine...</p>
            </div>
        );
    }

    const checkIsDirectionActive = (dir) => {
        if (activePhase === 'NS' && (dir === 'North' || dir === 'South')) return true;
        if (activePhase === 'EW' && (dir === 'East' || dir === 'West')) return true;
        return false;
    };

    const DirectionCard = ({ dir }) => {
        const count = laneCountsRef.current[dir] || 0;
        const density = laneDensitiesRef.current[dir] || 0;

        const isDirActive = checkIsDirectionActive(dir);
        const isActive = isDirActive && lightState !== 'RED';
        const isYellow = isDirActive && lightState === 'YELLOW';

        // Colors based on state
        const highlightClass = isActive
            ? (isYellow ? "ring-2 ring-yellow-500/50 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]" : "ring-2 ring-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]")
            : "border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/40 shadow-sm";

        const titleColor = isActive
            ? (isYellow ? "text-yellow-600 dark:text-yellow-400" : "text-emerald-700 dark:text-emerald-400")
            : "text-gray-700 dark:text-gray-300";

        const loadBarColor = density > 75
            ? 'bg-gradient-to-r from-red-500 to-rose-600'
            : density > 40
                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                : 'bg-gradient-to-r from-emerald-400 to-emerald-500';

        return (
            <div className={`rounded-2xl transition-all duration-500 border backdrop-blur-md p-5 flex items-center justify-between ${highlightClass}`}>

                {/* Traffic Light & Title */}
                <div className="flex items-center space-x-6">
                    {/* Oversized Traffic Light */}
                    <div className="flex flex-col space-y-2 bg-gray-900 dark:bg-[#0B0E14] p-2.5 rounded-xl border border-gray-700/80 shadow-inner">
                        <div className={`w-4 h-4 rounded-full ${!isDirActive || lightState === 'RED' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-110' : 'bg-red-500/20'}`}></div>
                        <div className={`w-4 h-4 rounded-full ${isDirActive && lightState === 'YELLOW' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] scale-110' : 'bg-yellow-400/20'}`}></div>
                        <div className={`w-4 h-4 rounded-full ${isDirActive && lightState === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110' : 'bg-emerald-500/20'}`}></div>
                    </div>

                    <div className="flex flex-col">
                        <h4 className={`text-2xl font-black uppercase tracking-wider ${titleColor}`}>{dir}</h4>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase">Direction</span>
                    </div>
                </div>

                {/* Density Bar */}
                <div className="flex-1 px-8 hidden sm:block">
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                        <div className={`h-full ${loadBarColor} transition-all duration-1000 ease-out`} style={{ width: `${density}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{density.toFixed(1)}% Load</span>
                        {density > 75 && <span className="text-xs font-bold text-red-500 uppercase tracking-widest animate-pulse">Heavy Traffic</span>}
                    </div>
                </div>

                {/* Big Count */}
                <div className="flex flex-col items-end justify-center min-w-[80px]">
                    <span className={`text-5xl font-black tracking-tighter ${isActive ? titleColor : 'text-gray-800 dark:text-white'}`}>
                        {count}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Vehicles</span>
                </div>
            </div>
        );
    };

    return (
        <div className={`glass-card rounded-3xl relative group overflow-visible ${compact ? 'p-3 w-full shadow-lg' : 'p-6 sm:p-10 mb-8 w-full shadow-2xl border border-white/20 dark:border-gray-800'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-purple-50/10 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-3xl z-0 pointer-events-none"></div>

            <div className="relative z-10">
                {/* Dashboard Header */}
                <div className={`flex justify-between items-center ${compact ? 'mb-3' : 'mb-10'}`}>
                    <div className="flex flex-col">
                        <h3 className={`${compact ? 'text-base' : 'text-4xl'} font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight flex items-center`}>
                            <Activity className="w-8 h-8 mr-4 text-indigo-500" />
                            Intersection Monitor
                        </h3>
                        {!compact && (
                            <div className="flex items-center mt-3 space-x-4">
                                <span className={`${isPlaying ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'} text-xs font-black px-3 py-1.5 rounded-full border flex items-center uppercase tracking-widest transition-colors`}>
                                    <Zap className="w-3 h-3 mr-1.5" />
                                    {isPlaying ? 'Live Active' : 'Offline'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Central Timer & Controls */}
                    <div className="flex items-center bg-white/80 dark:bg-black/80 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                        {/* Control Modes */}
                        {!compact && (
                            <div className="flex flex-col justify-center space-y-2 mr-6 border-r border-gray-200 dark:border-gray-800 pr-6">
                                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-gray-400">Mode</span>
                                <button
                                    onClick={toggleMode}
                                    className={`text-xs px-4 py-2 sm:py-3 rounded-xl font-bold flex items-center space-x-2 transition-all ${isManualMode ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'}`}
                                >
                                    {isManualMode ? <Hand className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                                    <span className="tracking-wide">{isManualMode ? 'MANUAL' : 'AUTO'}</span>
                                </button>
                            </div>
                        )}

                        {/* Phase Selector (Manual) */}
                        {isManualMode && !compact && (
                            <div className="flex flex-col space-y-2 mr-6">
                                {PHASE_SEQUENCE.map((phase) => (
                                    <button
                                        key={phase}
                                        onClick={() => handleManualSwitch(phase)}
                                        className={`px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-between min-w-[140px] ${activePhase === phase || pendingPhase === phase ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-600 hover:bg-gray-200 dark:hover:bg-white/10 dark:text-gray-300'}`}
                                    >
                                        <span>{PHASE_NAMES[phase]}</span>
                                        {pendingPhase === phase && <Settings className="w-3.5 h-3.5 animate-spin ml-2" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Timer Big Block */}
                        <div className="flex flex-col items-center justify-center relative px-6 py-2 min-w-[120px]">
                            {/* Glow behind timer */}
                            <div className={`absolute inset-0 opacity-20 blur-2xl transition-colors duration-500 rounded-3xl ${lightState === 'RED' ? 'bg-red-500' : lightState === 'YELLOW' ? 'bg-yellow-400' : 'bg-emerald-500'}`}></div>

                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black mb-1 z-10 text-center drop-shadow-sm">
                                {PHASE_NAMES[activePhase]}
                            </span>
                            <span className={`text-6xl sm:text-7xl font-mono font-black tracking-tighter leading-none z-10 drop-shadow-2xl transition-colors duration-300 ${lightState === 'RED' ? 'text-red-500' : lightState === 'YELLOW' ? 'text-yellow-400' : 'text-emerald-500'}`}>
                                {(isManualMode && lightState === 'GREEN' && !pendingPhase) ? '∞' : timeRemaining.toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Master Grid containing Axes Groups */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                    {/* North-South Group */}
                    <div className="flex-1 flex flex-col space-y-4">
                        <div className="flex items-center space-x-3 mb-2 px-2">
                            <h4 className="text-sm font-extrabold text-gray-400 dark:text-gray-500 tracking-[0.2em] uppercase">North-South Axis</h4>
                            <div className={`flex-1 h-px ${activePhase === 'NS' ? 'bg-indigo-500/50' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                        </div>
                        <DirectionCard dir="North" />
                        <DirectionCard dir="South" />
                    </div>

                    {/* East-West Group */}
                    <div className="flex-1 flex flex-col space-y-4">
                        <div className="flex items-center space-x-3 mb-2 px-2">
                            <h4 className="text-sm font-extrabold text-gray-400 dark:text-gray-500 tracking-[0.2em] uppercase">East-West Axis</h4>
                            <div className={`flex-1 h-px ${activePhase === 'EW' ? 'bg-indigo-500/50' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                        </div>
                        <DirectionCard dir="East" />
                        <DirectionCard dir="West" />
                    </div>

                </div>
            </div>
        </div>
    );
}
