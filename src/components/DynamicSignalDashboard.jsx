import React, { useState, useEffect, useRef } from 'react';

// Green durations (seconds) for low/medium/high traffic
const GREEN_DURATION_LOW = 8;
const GREEN_DURATION_MED = 18;
const GREEN_DURATION_HIGH = 30;

// Helper to determine duration based on density
const assignGreenDuration = (density) => {
    let d = Math.max(0, Math.min(100, density));
    let secs = Math.round(GREEN_DURATION_LOW + (d / 100) * (GREEN_DURATION_HIGH - GREEN_DURATION_LOW));
    return secs;
};

// Map direction correctly for display
const DIRECTIONS = ['North', 'South', 'East', 'West'];
// A simple object to sort next directions (clockwise etc) could be employed, 
// here we use a round-robin that skips nicely to the highest if tied, or just strictly highest config
const getNextGreenLane = (currentActive, laneDensities) => {
    // simple fallback if none has density
    const defaultNext = {
        North: 'East', East: 'South', South: 'West', West: 'North'
    };

    // Find highest density
    let maxDens = -1;
    let candidates = [];

    Object.entries(laneDensities).forEach(([lane, dens]) => {
        if (lane !== currentActive && dens > maxDens) {
            maxDens = dens;
            candidates = [lane];
        } else if (lane !== currentActive && dens === maxDens) {
            candidates.push(lane);
        }
    });

    if (maxDens > 0) {
        // give to the highest density candidate (pick the one next in rotation if tied)
        let nextInRotation = defaultNext[currentActive] || 'North';
        if (candidates.includes(nextInRotation)) return nextInRotation;
        return candidates[0] || nextInRotation;
    }

    return defaultNext[currentActive] || 'North';
};

export default function DynamicSignalDashboard({ timeSeriesData, currentTime = 0, isPlaying = false, compact = false }) {
    const [currentStats, setCurrentStats] = useState(null);

    // Smart Controller State
    const [activeSignal, setActiveSignal] = useState('North');
    const [lightState, setLightState] = useState('GREEN'); // GREEN, YELLOW, RED (transitioning)
    const [timeRemaining, setTimeRemaining] = useState(0);

    const timeRemainingRef = useRef(timeRemaining);
    const activeSignalRef = useRef(activeSignal);
    const lightStateRef = useRef(lightState);
    const laneDensitiesRef = useRef({});

    useEffect(() => {
        timeRemainingRef.current = timeRemaining;
        activeSignalRef.current = activeSignal;
        lightStateRef.current = lightState;
    }, [timeRemaining, activeSignal, lightState]);

    // Fast lookup for current time in timeSeriesData
    useEffect(() => {
        if (!timeSeriesData || timeSeriesData.length === 0) return;

        // Find the closest stats snapshot
        // binary search or simple loop if small
        let closest = timeSeriesData[0];
        // Time series data is sorted by timestamp typically
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
        }

    }, [timeSeriesData, currentTime]);

    // The main signal loop
    useEffect(() => {
        // If not playing, don't run the signal countdown
        if (!isPlaying) return;

        // Initialize state if 0
        if (timeRemainingRef.current === 0 && lightStateRef.current === 'GREEN') {
            const initialDensities = laneDensitiesRef.current;
            const startingLane = getNextGreenLane('', initialDensities);
            const duration = assignGreenDuration(initialDensities[startingLane] || 0);

            setActiveSignal(startingLane);
            setTimeRemaining(duration);
            setLightState('GREEN');
            return;
        }

        const interval = setInterval(() => {
            let tr = timeRemainingRef.current;
            let ls = lightStateRef.current;
            let currentSig = activeSignalRef.current;

            if (tr > 1) {
                setTimeRemaining((prev) => prev - 1);
            } else {
                // Transition logic
                if (ls === 'GREEN') {
                    // Switch to YELLOW for 3 seconds
                    setLightState('YELLOW');
                    setTimeRemaining(3);
                } else if (ls === 'YELLOW') {
                    // Switch to RED for 2 seconds (All-Red clearance)
                    setLightState('RED');
                    setTimeRemaining(2);
                } else if (ls === 'RED') {
                    // Switch to new GREEN
                    const nextSig = getNextGreenLane(currentSig, laneDensitiesRef.current);
                    setActiveSignal(nextSig);
                    setLightState('GREEN');
                    const nextDuration = assignGreenDuration(laneDensitiesRef.current[nextSig] || 0);
                    setTimeRemaining(nextDuration);
                }
            }
        }, 1000); // Ticks every 1 second

        return () => clearInterval(interval);
    }, [isPlaying]);

    if (!timeSeriesData || timeSeriesData.length === 0) {
        return (
            <div className={`glass-card rounded-2xl p-6 mt-6 flex flex-col items-center justify-center ${compact ? 'min-h-[100px] max-w-sm' : 'min-h-[200px]'}`}>
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Initializing Analytics Engine...</p>
            </div>
        );
    }

    const lane_counts = currentStats?.lane_counts || { North: 0, South: 0, East: 0, West: 0 };
    const lane_densities = currentStats?.lane_densities || { North: 0, South: 0, East: 0, West: 0 };

    const getLightColorClasses = (direction, type, isCompact) => {
        // type = 'red', 'yellow', 'green'
        let base = `${isCompact ? 'w-2.5 h-2.5' : 'w-4 h-4'} rounded-full transition-all duration-300 mx-auto `;
        let onColor = "";
        let offColor = "bg-gray-300 dark:bg-gray-700 opacity-20";

        if (type === 'red') onColor = `bg-red-500 shadow-[0_0_${isCompact ? '8px' : '15px'}_rgba(239,68,68,0.8)]`;
        if (type === 'yellow') onColor = `bg-yellow-400 shadow-[0_0_${isCompact ? '8px' : '15px'}_rgba(250,204,21,0.8)]`;
        if (type === 'green') onColor = `bg-green-500 shadow-[0_0_${isCompact ? '8px' : '15px'}_rgba(34,197,94,0.8)]`;

        if (direction === activeSignal) {
            if (lightState === 'GREEN' && type === 'green') return base + onColor;
            if (lightState === 'YELLOW' && type === 'yellow') return base + onColor;
            if (lightState === 'RED' && type === 'red') return base + onColor; // ALL RED clearance
            return base + offColor;
        } else {
            // Non-active signals are strictly RED
            if (type === 'red') return base + onColor;
            return base + offColor;
        }
    };

    return (
        <div className={`glass-card rounded-2xl relative group overflow-visible ${compact ? 'p-4 max-w-sm shadow-2xl' : 'p-8 mt-8 mb-8'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/10 to-purple-50/10 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl z-0 pointer-events-none"></div>

            <div className="relative z-10">
                <div className={`flex justify-between items-center ${compact ? 'mb-4' : 'mb-6'}`}>
                    <div>
                        <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 leading-tight`}>
                            Smart Controller
                        </h3>
                        {!compact && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                <span className={`w-2 h-2 rounded-full mr-2 ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                {isPlaying ? 'Live Adjustment Active' : 'Playback Paused'}
                            </p>
                        )}
                    </div>

                    {/* Active Timer Display */}
                    <div className={`flex flex-col items-center justify-center bg-gray-900/90 dark:bg-black/80 rounded-xl border border-white/10 dark:border-white/5 shadow-inner backdrop-blur-md relative overflow-hidden ${compact ? 'p-2 w-20' : 'p-4 w-36 h-24'}`}>
                        {/* Glow effect behind timer */}
                        <div className={`absolute inset-0 opacity-20 blur-xl ${lightState === 'RED' ? 'bg-red-500' : lightState === 'YELLOW' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>

                        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-300 dark:text-gray-400 uppercase tracking-widest mb-1 leading-none font-bold z-10`}>{activeSignal}</span>
                        <span className={`${compact ? 'text-2xl' : 'text-5xl'} font-mono font-black tracking-tighter leading-none z-10 drop-shadow-lg ${lightState === 'RED' ? 'text-red-500' :
                            lightState === 'YELLOW' ? 'text-yellow-400' : 'text-green-500'
                            }`}>
                            {timeRemaining.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
                    {DIRECTIONS.map((dir) => {
                        const count = lane_counts[dir] || 0;
                        const density = lane_densities[dir] || 0;
                        const isActive = (dir === activeSignal && lightState !== 'RED'); // 'RED' state is global red

                        // Compute background highlight class if active
                        const highlightClass = isActive
                            ? "ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40 shadow-[0_0_15px_rgba(79,70,229,0.15)]"
                            : "bg-white/40 dark:bg-black/20 border-white/30 dark:border-white/5 transition-all hover:bg-white/60 dark:hover:bg-black/40";

                        const densityColor = density > 75 ? 'bg-gradient-to-r from-red-500 to-rose-600' : density > 50 ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-green-500';

                        return (
                            <div key={dir} className={`rounded-xl transition-all duration-300 border backdrop-blur-sm ${highlightClass} relative overflow-hidden ${compact ? 'p-2.5' : 'p-5'}`}>
                                {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>}

                                <div className={`flex justify-between items-center ${compact ? 'mb-2' : 'mb-4'}`}>
                                    {/* Traffic Light Signal (Vertical/Horizontal depending on compact) */}
                                    <div className={`bg-gray-900 dark:bg-[#0B0E14] p-1.5 rounded-lg flex border border-gray-700 shadow-inner ${compact ? 'flex-row space-x-1.5' : 'flex-col space-y-2 p-2 rounded-xl'}`}>
                                        <div className={getLightColorClasses(dir, 'red', compact)}></div>
                                        <div className={getLightColorClasses(dir, 'yellow', compact)}></div>
                                        <div className={getLightColorClasses(dir, 'green', compact)}></div>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0 z-10">
                                        <h4 className={`font-black text-gray-900 dark:text-white uppercase tracking-wider ${compact ? 'text-xs' : 'text-lg leading-tight'}`}>{dir.substring(0, compact ? 1 : 4)}</h4>
                                        <p className={`font-bold text-gray-500 dark:text-gray-400 leading-tight mt-0.5 ${compact ? 'text-[10px]' : 'text-sm'}`}>{count} <span className={compact ? 'hidden' : 'font-medium'}>Vehicles</span></p>
                                    </div>
                                </div>

                                <div className="w-full bg-gray-200/80 dark:bg-gray-800/80 rounded-full h-2 mt-2 overflow-hidden shadow-inner flex">
                                    <div
                                        className={`h-full rounded-full ${densityColor} transition-all duration-1000 ease-out flex-[0_0_auto] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]`}
                                        style={{ width: `${density}%` }}
                                    ></div>
                                </div>
                                <div className={`text-right font-black mt-1 text-gray-600 dark:text-gray-400 tracking-tighter ${compact ? 'text-[10px]' : 'text-xs'}`}>
                                    {density.toFixed(0)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
