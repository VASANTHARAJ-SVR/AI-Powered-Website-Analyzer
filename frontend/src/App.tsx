import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AnalyzerDashboard } from './pages/AnalyzerDashboard';
import AnalyzerRedirect from './pages/AnalyzerRedirect';
import Dashboard from './pages/Dashboard';
import './App.css';

function AppLayout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyze" element={<AnalyzerRedirect />} />
          <Route path="/dashboard/:reportId" element={<Dashboard />} />
          <Route path="/analyzer" element={<AnalyzerDashboard />} />
          <Route path="*" element={<div className="not-found">Page Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;

