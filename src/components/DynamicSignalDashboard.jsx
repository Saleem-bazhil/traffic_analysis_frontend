import React, { useEffect, useRef, useState } from 'react';
import { Activity, Bot, Hand, RotateCw } from 'lucide-react';

const GREEN_DURATION_LOW = 10;
const GREEN_DURATION_HIGH = 35;
const MANUAL_DEFAULT_TIME = 15;

const assignGreenDuration = (density) => {
    const boundedDensity = Math.max(0, Math.min(100, density));
    return Math.round(
        GREEN_DURATION_LOW + (boundedDensity / 100) * (GREEN_DURATION_HIGH - GREEN_DURATION_LOW)
    );
};

const getPhaseDensity = (phase, densities) => {
    if (!densities || Object.keys(densities).length === 0) return 0;
    if (phase === 'NS') return Math.max(densities.North || 0, densities.South || 0);
    return Math.max(densities.East || 0, densities.West || 0);
};

const SIGNAL_COLORS = {
    RED: {
        off: 'bg-red-950/80 border-red-900/80',
        on: 'bg-red-500 border-red-300 shadow-[0_0_28px_rgba(239,68,68,0.9)]',
        text: 'text-red-300',
        badge: 'border-red-400/40 bg-red-500/15 text-red-200',
    },
    YELLOW: {
        off: 'bg-amber-950/80 border-amber-900/80',
        on: 'bg-yellow-300 border-yellow-100 shadow-[0_0_28px_rgba(253,224,71,0.95)]',
        text: 'text-yellow-200',
        badge: 'border-yellow-300/40 bg-yellow-400/15 text-yellow-100',
    },
    GREEN: {
        off: 'bg-emerald-950/80 border-emerald-900/80',
        on: 'bg-emerald-400 border-emerald-100 shadow-[0_0_28px_rgba(52,211,153,0.9)]',
        text: 'text-emerald-200',
        badge: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
    },
};

const getDirectionSignal = (dir, activePhase, lightState) => {
    const nsActive = dir === 'North' || dir === 'South';
    const isActive = (activePhase === 'NS' && nsActive) || (activePhase === 'EW' && !nsActive);
    return isActive ? lightState : 'RED';
};

function SignalLens({ color, active }) {
    const theme = SIGNAL_COLORS[color];

    return (
        <div
            className={`h-3 w-3 rounded-full border transition-all duration-300 sm:h-4 sm:w-4 ${
                active ? theme.on : theme.off
            }`}
        >
            <div className={`h-full w-full rounded-full ${active ? 'opacity-100' : 'opacity-25'} bg-white/10`}></div>
        </div>
    );
}

function SignalHead({ signal }) {
    return (
        <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-b from-slate-950 via-slate-950 to-black p-1.5 shadow-[inset_0_1px_4px_rgba(255,255,255,0.08),0_10px_24px_rgba(2,6,23,0.4)] sm:rounded-2xl sm:p-2">
            <div className="flex flex-col gap-1.5 rounded-lg bg-black/80 px-1.5 py-1.5 sm:gap-2 sm:rounded-xl sm:px-2 sm:py-2">
                <SignalLens color="RED" active={signal === 'RED'} />
                <SignalLens color="YELLOW" active={signal === 'YELLOW'} />
                <SignalLens color="GREEN" active={signal === 'GREEN'} />
            </div>
        </div>
    );
}

export default function DynamicSignalDashboard({ timeSeriesData, currentTime = 0, isPlaying = false, compact = false }) {
    const [mode, setMode] = useState('automatic');
    const [activePhase, setActivePhase] = useState('NS');
    const [lightState, setLightState] = useState('GREEN');
    const [timeRemaining, setTimeRemaining] = useState(0);

    const timeRemainingRef = useRef(timeRemaining);
    const activePhaseRef = useRef(activePhase);
    const lightStateRef = useRef(lightState);
    const laneDensitiesRef = useRef({});
    const modeRef = useRef(mode);

    useEffect(() => {
        timeRemainingRef.current = timeRemaining;
        activePhaseRef.current = activePhase;
        lightStateRef.current = lightState;
        modeRef.current = mode;
    }, [timeRemaining, activePhase, lightState, mode]);

    useEffect(() => {
        if (!timeSeriesData?.length) return;

        let closest = timeSeriesData[0];
        for (let i = 0; i < timeSeriesData.length; i += 1) {
            if (timeSeriesData[i].timestamp <= currentTime) {
                closest = timeSeriesData[i];
            } else {
                break;
            }
        }

        if (closest?.lane_densities) {
            laneDensitiesRef.current = closest.lane_densities;
        }
    }, [timeSeriesData, currentTime]);

    useEffect(() => {
        const interval = setInterval(() => {
            const tr = timeRemainingRef.current;
            const ls = lightStateRef.current;
            const phase = activePhaseRef.current;
            const currentMode = modeRef.current;

            if (currentMode === 'manual') {
                if (tr > 0) {
                    setTimeRemaining((prev) => prev - 1);
                }
                return;
            }

            if (tr === 0 && ls === 'GREEN') {
                const densities = laneDensitiesRef.current;
                if (Object.keys(densities).length > 0) {
                    setActivePhase('NS');
                    setLightState('GREEN');
                    setTimeRemaining(Math.max(assignGreenDuration(getPhaseDensity('NS', densities)), GREEN_DURATION_LOW));
                }
                return;
            }

            if (!isPlaying) return;

            if (tr > 1) {
                setTimeRemaining((prev) => prev - 1);
                return;
            }

            if (ls === 'GREEN') {
                setLightState('YELLOW');
                setTimeRemaining(4);
                return;
            }

            if (ls === 'YELLOW') {
                setLightState('RED');
                setTimeRemaining(3);
                return;
            }

            const nextPhase = phase === 'NS' ? 'EW' : 'NS';
            const nextDuration = assignGreenDuration(getPhaseDensity(nextPhase, laneDensitiesRef.current));
            setActivePhase(nextPhase);
            setLightState('GREEN');
            setTimeRemaining(Math.max(nextDuration, GREEN_DURATION_LOW));
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    if (!timeSeriesData?.length) {
        return (
            <div className={`glass-card rounded-2xl p-6 mt-6 flex flex-col items-center justify-center ${compact ? 'min-h-[100px] max-w-sm' : 'min-h-[200px]'}`}>
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Initializing signal monitor...</p>
            </div>
        );
    }

    const handleModeChange = (nextMode) => {
        setMode(nextMode);

        if (nextMode === 'automatic') {
            const nextPhase = 'NS';
            const nextDuration = assignGreenDuration(getPhaseDensity(nextPhase, laneDensitiesRef.current));
            setActivePhase(nextPhase);
            setLightState('GREEN');
            setTimeRemaining(Math.max(nextDuration, GREEN_DURATION_LOW));
            return;
        }

        setTimeRemaining((prev) => (prev > 0 ? prev : MANUAL_DEFAULT_TIME));
    };

    const manualSetAxis = (nextPhase) => {
        setMode('manual');
        setActivePhase(nextPhase);
        setTimeRemaining((prev) => (prev > 0 ? prev : MANUAL_DEFAULT_TIME));
    };

    const manualSetLight = (nextState) => {
        setMode('manual');
        setLightState(nextState);
        setTimeRemaining(
            nextState === 'GREEN' ? MANUAL_DEFAULT_TIME : nextState === 'YELLOW' ? 4 : 3
        );
    };

    const manualReset = () => {
        setMode('manual');
        setActivePhase('NS');
        setLightState('RED');
        setTimeRemaining(MANUAL_DEFAULT_TIME);
    };

    const directions = ['North', 'South', 'East', 'West'];
    let currentSnapshot = timeSeriesData[0] || { lane_densities: {}, lane_counts: {} };
    for (let i = 0; i < timeSeriesData.length; i += 1) {
        if (timeSeriesData[i].timestamp <= currentTime) {
            currentSnapshot = timeSeriesData[i];
        } else {
            break;
        }
    }

    const activeCountTotal = directions.reduce((sum, dir) => {
        return sum + (currentSnapshot.lane_densities?.[dir] || 0);
    }, 0);

    const getLoadLabel = (density) => {
        if (density >= 80) return 'Heavy Traffic';
        if (density >= 45) return 'Moderate Flow';
        return 'Light Flow';
    };

    const getDirectionShortLabel = (dir) => {
        if (dir === 'North') return 'NORTH';
        if (dir === 'South') return 'SOUTH';
        if (dir === 'East') return 'EAST';
        return 'WEST';
    };

    const DirectionCard = ({ dir }) => {
        const currentSignal = getDirectionSignal(dir, activePhase, lightState);
        const theme = SIGNAL_COLORS[currentSignal];
        const density = currentSnapshot.lane_densities?.[dir] || 0;
        const count = currentSnapshot.lane_counts?.[dir] || 0;
        const isActive = currentSignal !== 'RED';
        const trafficLabel = getLoadLabel(density);
        const progressWidth = Math.max(12, density);
        const shortLabel = getDirectionShortLabel(dir);
        const timerLabel = isActive ? `${timeRemaining}s left` : 'waiting';

        return (
            <div className={`rounded-2xl border p-3 shadow-[0_18px_40px_rgba(7,10,30,0.35)] sm:rounded-[1.35rem] sm:p-5 ${
                isActive
                    ? 'border-cyan-400/55 bg-[linear-gradient(135deg,rgba(29,50,74,0.96),rgba(22,26,48,0.98))]'
                    : 'border-white/8 bg-[linear-gradient(135deg,rgba(27,24,45,0.96),rgba(18,16,34,0.98))]'
            }`}>
                <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-4">
                    <SignalHead signal={currentSignal} />

                    <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className={`text-lg font-black uppercase leading-none tracking-tight sm:text-2xl ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                                    {shortLabel}
                                </p>
                                <p className="mt-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-slate-500 sm:mt-2 sm:text-[10px] sm:tracking-[0.24em]">
                                    {dir} direction
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="font-mono text-xl font-black leading-none text-white sm:text-3xl">
                                    {count}
                                </p>
                                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-[9px] sm:tracking-[0.18em]">
                                    Vehicles
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 sm:mt-4">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em] ${theme.badge}`}>
                                    {isActive ? 'Open Lane' : 'Stop Lane'}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] sm:text-xs sm:tracking-[0.14em] ${theme.text}`}>
                                    {currentSignal}
                                </span>
                            </div>

                            <div className="h-2 rounded-full bg-slate-950/80 sm:h-2.5">
                                <div
                                    className={`h-full rounded-full ${
                                        density >= 80 ? 'bg-rose-500' : density >= 45 ? 'bg-amber-400' : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${progressWidth}%` }}
                                ></div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 sm:gap-3">
                                <div className="rounded-xl bg-black/15 px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-[9px] sm:tracking-[0.18em]">
                                        Load
                                    </p>
                                    <p className="mt-1 text-sm font-bold leading-tight text-slate-200">
                                        {density.toFixed(1)}%
                                    </p>
                                </div>

                                <div className="rounded-xl bg-black/15 px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-[9px] sm:tracking-[0.18em]">
                                        Traffic
                                    </p>
                                    <p className={`mt-1 text-sm font-black uppercase leading-tight ${theme.text}`}>
                                        {trafficLabel}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-black/15 px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-[9px] sm:tracking-[0.18em]">
                                        Timer
                                    </p>
                                    <p className="mt-1 text-sm font-bold uppercase leading-tight text-slate-200">
                                        {timerLabel}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`glass-card relative overflow-hidden rounded-[1.5rem] ${compact ? 'p-3 w-full shadow-lg' : 'mb-8 w-full border border-white/10 p-4 sm:p-7 shadow-2xl dark:border-gray-800'}`}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,18,38,0.98),rgba(24,19,48,0.98))]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.12),transparent_24%)] pointer-events-none"></div>
            <div className="relative z-10">
                <div className={`${compact ? 'mb-3' : 'mb-5'} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}>
                    <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950/40 px-3 py-2.5 sm:px-4 sm:py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 sm:h-10 sm:w-10">
                            <Activity className="h-4 w-4 text-violet-300 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                            <p className="text-base font-black text-white sm:text-lg">TrafficFlow</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.24em]">Signal Control Panel</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                        <button
                            type="button"
                            onClick={() => handleModeChange('automatic')}
                            className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                                mode === 'automatic'
                                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
                                    : 'border-white/10 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <Bot className="h-4 w-4" />
                            Automatic
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('manual')}
                            className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                                mode === 'manual'
                                    ? 'border-amber-300/40 bg-amber-400/15 text-amber-100'
                                    : 'border-white/10 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <Hand className="h-4 w-4" />
                            Manual
                        </button>
                    </div>
                </div>

                <div className="mb-4 grid gap-4 sm:gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)]">
                    <div className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,24,47,0.88),rgba(25,20,49,0.92))] p-3 sm:rounded-[1.7rem] sm:p-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
                            {directions.map((dir) => (
                                <DirectionCard key={dir} dir={dir} />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,20,38,0.95),rgba(23,18,42,0.98))] p-4 sm:rounded-[1.7rem] sm:p-5">
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">
                                    Control Mode
                                </p>
                                <p className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-white sm:text-3xl">
                                    {mode}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-black/30 px-4 py-3 text-left sm:text-right">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                                    Active Axis
                                </p>
                                <p className="mt-2 text-3xl font-black text-white">{activePhase}</p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-slate-950/60 p-4 sm:mt-5">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Axis</p>
                                    <p className="mt-1 text-lg font-black text-emerald-400">{activePhase}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Signal</p>
                                    <p className={`mt-1 text-lg font-black ${SIGNAL_COLORS[lightState].text}`}>{lightState}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Countdown</p>
                                    <p className="mt-1 font-mono text-lg font-black text-white">{timeRemaining}s</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Average Load</p>
                            <div className="mt-3 h-2.5 rounded-full bg-slate-950/80">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400"
                                    style={{ width: `${Math.max(10, activeCountTotal / directions.length)}%` }}
                                ></div>
                            </div>
                            <p className="mt-2 text-lg font-black text-white">{(activeCountTotal / directions.length).toFixed(1)}%</p>
                        </div>

                        <div className="mt-4 space-y-4 sm:mt-5">
                            <div>
                                <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                                    Axis Select
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {[
                                        { label: 'North South', value: 'NS' },
                                        { label: 'East West', value: 'EW' },
                                    ].map((axis) => (
                                        <button
                                            key={axis.value}
                                            type="button"
                                            onClick={() => manualSetAxis(axis.value)}
                                            className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
                                                activePhase === axis.value
                                                    ? 'border-sky-400/40 bg-sky-500/15 text-sky-100'
                                                    : 'border-white/10 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                                            }`}
                                        >
                                            {axis.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                                    Manual Light
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {['RED', 'YELLOW', 'GREEN'].map((signal) => (
                                        <button
                                            key={signal}
                                            type="button"
                                            onClick={() => manualSetLight(signal)}
                                            className={`rounded-2xl border px-3 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors ${
                                                lightState === signal
                                                    ? SIGNAL_COLORS[signal].badge
                                                    : 'border-white/10 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                                            }`}
                                        >
                                            {signal}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                                    Current Status
                                </p>
                                <p className={`mt-2 text-lg font-black uppercase tracking-[0.16em] ${SIGNAL_COLORS[lightState].text}`}>
                                    {lightState} on {activePhase}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                    {mode === 'automatic'
                                        ? 'Automatic follows the detected traffic density and video playback.'
                                        : 'Manual lets you force the exact axis and lamp state from this console.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={manualReset}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-800"
                            >
                                <RotateCw className="h-4 w-4" />
                                Reset Manual Console
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
