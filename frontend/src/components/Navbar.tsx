import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import './Navbar.css';

export function Navbar() {
    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-brand">
                    <Activity className="navbar-icon" />
                    <span>WebAudit AI</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/" className="nav-link">Analyzer</Link>
                    <Link to="/history" className="nav-link">History</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                    >
                        GitHub
                    </a>
                </div>
            </div>
        </nav>
    );
}
