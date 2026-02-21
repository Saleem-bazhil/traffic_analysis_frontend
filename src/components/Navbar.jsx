import { Link } from 'react-router-dom';
import { Moon, Sun, Activity } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
            <div className="container mx-auto max-w-5xl glass-panel rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto">
                <Link to="/" className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl group">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-1.5 rounded-lg group-hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-300">
                        <Activity className="h-5 w-5" />
                    </div>
                    <span className="tracking-tight">TrafficFlow</span>
                </Link>
                <div className="flex items-center space-x-2 md:space-x-6">
                    <Link to="/" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden md:block">
                        Analysis
                    </Link>
                    <Link to="/history" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden md:block">
                        History
                    </Link>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden md:block mx-2"></div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        aria-label="Toggle Dark Mode"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
