import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, CheckCircle, Smartphone } from 'lucide-react';
import './LandingPage.css';

export function LandingPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate(`/analyze?url=${encodeURIComponent(url)}`);
        }, 1500);
    };

    const features = [
        { icon: Zap, label: "Performance", desc: "Core Web Vitals" },
        { icon: Search, label: "SEO", desc: "Meta & Structure" },
        { icon: Smartphone, label: "UX / Mobile", desc: "Responsiveness" },
        { icon: CheckCircle, label: "Accessibility", desc: "WCAG Compliance" },
    ];

    return (
        <div className="landing-page">
            <section className="hero-section">
                <div className="hero-content">
                    <div className="badge">
                        <span className="badge-dot"></span>
                        AI-Powered Website Audit Tool (Free)
                    </div>
                    <h1 className="hero-title">
                        Audit your website in <span className="highlight">seconds</span>
                    </h1>
                    <p className="hero-subtitle">
                        Get comprehensive SEO, Performance, Accessibility, and Content insights powered by advanced AI analysis.
                    </p>

                    <form onSubmit={handleSubmit} className="url-form">
                        <input
                            type="url"
                            placeholder="Enter your website URL (https://...)"
                            className="url-input"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Scanning...' : (
                                <>Analyze <Search className="btn-icon" /></>
                            )}
                        </button>
                    </form>

                    <div className="features-grid">
                        {features.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="feature-card">
                                    <Icon className="feature-icon" />
                                    <div className="feature-label">{item.label}</div>
                                    <div className="feature-desc">{item.desc}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
