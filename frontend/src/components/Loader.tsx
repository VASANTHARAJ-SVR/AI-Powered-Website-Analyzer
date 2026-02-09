import { useState, useEffect } from 'react';
import { Search, Zap, Globe, Shield, Eye, Activity, Code, Scan, Wifi, Database } from 'lucide-react';
import './Loader.css';

const crawlSteps = [
    { msg: "Crawling website structure", detail: "Discovering pages & routes", icon: Search },
    { msg: "Scanning meta tags", detail: "Title, description, OG tags", icon: Globe },
    { msg: "Analyzing Core Web Vitals", detail: "LCP · FID · CLS · TTFB", icon: Zap },
    { msg: "Running accessibility audit", detail: "WCAG 2.1 axe-core checks", icon: Eye },
    { msg: "Evaluating mobile UX", detail: "Viewport, touch targets, layout", icon: Shield },
    { msg: "Processing images & assets", detail: "Compression, formats, lazy-load", icon: Code },
    { msg: "Measuring load performance", detail: "JS, CSS, request waterfall", icon: Activity },
    { msg: "Checking connectivity", detail: "SSL, redirects, status codes", icon: Wifi },
    { msg: "Parsing structured data", detail: "Schema.org, JSON-LD markers", icon: Scan },
    { msg: "Generating AI insights", detail: "Scoring & recommendation engine", icon: Database },
];

const TOTAL_STEPS = crawlSteps.length;

export default function Loader() {
    const [stepIndex, setStepIndex] = useState(0);
    const [dots, setDots] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setStepIndex((prev) => {
                const next = (prev + 1) % TOTAL_STEPS;
                setProgress(((next + 1) / TOTAL_STEPS) * 100);
                return next;
            });
        }, 1200);

        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);

        // Kickstart progress
        setProgress((1 / TOTAL_STEPS) * 100);

        return () => {
            clearInterval(stepInterval);
            clearInterval(dotsInterval);
        };
    }, []);

    const step = crawlSteps[stepIndex];
    const CurrentIcon = step.icon;

    return (
        <div className="crawler-container">
            {/* Background Effects */}
            <div className="crawler-bg">
                <div className="crawler-grid"></div>
                <div className="scan-lines">
                    <div className="scan-line scan-line-1"></div>
                    <div className="scan-line scan-line-2"></div>
                    <div className="scan-line scan-line-3"></div>
                </div>
            </div>

            {/* Corner Brackets */}
            <div className="corner-brackets">
                <div className="bracket bracket-tl" />
                <div className="bracket bracket-tr" />
                <div className="bracket bracket-bl" />
                <div className="bracket bracket-br" />
            </div>

            {/* Main Content */}
            <div className="crawler-content">
                {/* Central Scanner Hub */}
                <div className="scanner-hub">
                    <div className="scanner-ring scanner-ring-orbit"></div>
                    <div className="scanner-ring scanner-ring-outer"></div>
                    <div className="scanner-ring scanner-ring-middle"></div>
                    <div className="scanner-ring scanner-ring-inner"></div>

                    <div className="scanner-core">
                        <div className="scanner-beam"></div>
                        <div className="icon-container">
                            <CurrentIcon size={26} className="scanner-icon" />
                        </div>
                    </div>

                    <div className="particles">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className={`particle particle-${i + 1}`}></div>
                        ))}
                    </div>
                </div>

                {/* Badge */}
                <div className="crawler-badge">
                    <span className="crawler-badge-dot" />
                    Deep Analysis in Progress
                </div>

                {/* Status */}
                <div className="status-section">
                    <div className="status-message" key={stepIndex}>
                        {step.msg}
                    </div>
                    <span className="status-message-accent">{step.detail}</span>

                    {/* Progress Bar */}
                    <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="progress-indicators">
                        {/* Step pips */}
                        <div className="step-indicators">
                            {crawlSteps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`step-pip ${i === stepIndex ? 'active' : i < stepIndex ? 'done' : ''}`}
                                />
                            ))}
                        </div>

                        <div className="pulse-dots">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`pulse-dot pulse-dot-${i + 1}`}></div>
                            ))}
                        </div>

                        <div className="crawl-progress">
                            <span className="progress-text">Crawling{dots}</span>
                        </div>
                    </div>
                </div>

                {/* Side Crawlers */}
                <div className="side-crawlers">
                    <div className="side-crawler left-crawler">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`crawler-segment segment-${i + 1}`}></div>
                        ))}
                    </div>
                    <div className="side-crawler right-crawler">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`crawler-segment segment-${i + 1}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
