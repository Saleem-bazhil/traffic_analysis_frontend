import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import AnalysisDetailPage from './pages/AnalysisDetailPage';
import { useTheme } from './hooks/useTheme';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="min-h-screen flex flex-col transition-colors duration-200">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
