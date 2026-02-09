import { useState, useEffect, useRef } from 'react';
import {
    Search, Zap, Globe, Shield, Eye, Activity, Code, Scan, Wifi, Database,
    CheckCircle, BarChart3, Gauge, Smartphone, FileText
} from 'lucide-react';
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

const moduleCards = [
    { label: "Performance", icon: Gauge, color: "#00C49F", activateAt: 2 },
    { label: "SEO", icon: Search, color: "#6366F1", activateAt: 4 },
    { label: "UX", icon: Smartphone, color: "#F59E0B", activateAt: 6 },
    { label: "Content", icon: FileText, color: "#EC4899", activateAt: 8 },
];

const TOTAL_STEPS = crawlSteps.length;

export default function Loader() {
    const [stepIndex, setStepIndex] = useState(0);
    const [dots, setDots] = useState('');
    const [progress, setProgress] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [dataPoints, setDataPoints] = useState(0);
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setStepIndex((prev) => {
                const next = (prev + 1) % TOTAL_STEPS;
                setProgress(((next + 1) / TOTAL_STEPS) * 100);
                setCompletedSteps((cs) => {
                    if (!cs.includes(prev)) return [...cs, prev];
                    return cs;
                });
                return next;
            });
        }, 1400);

        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);

        // Tick up fake data points
        const dataInterval = setInterval(() => {
            setDataPoints((p) => p + Math.floor(Math.random() * 12 + 3));
        }, 300);

        setProgress((1 / TOTAL_STEPS) * 100);

        return () => {
            clearInterval(stepInterval);
            clearInterval(dotsInterval);
            clearInterval(dataInterval);
        };
    }, []);

    // Auto-scroll log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [completedSteps, stepIndex]);

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
                {/* Data streams */}
                <div className="data-streams">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`data-stream stream-${i + 1}`} />
                    ))}
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
                            <CurrentIcon size={28} className="scanner-icon" />
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

                {/* Glitch title */}
                <h2 className="crawler-title" data-text={step.msg}>
                    {step.msg}
                </h2>
                <span className="status-message-accent">{step.detail}</span>

                {/* Module preview cards */}
                <div className="module-previews">
                    {moduleCards.map((mod) => {
                        const Icon = mod.icon;
                        const active = completedSteps.length >= mod.activateAt;
                        return (
                            <div
                                key={mod.label}
                                className={`module-preview-card ${active ? 'active' : ''}`}
                                style={{ '--mod-color': mod.color } as React.CSSProperties}
                            >
                                <Icon size={16} />
                                <span>{mod.label}</span>
                                {active && <CheckCircle size={12} className="mod-check" />}
                            </div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                        <div className="progress-bar-shine" />
                    </div>
                </div>

                {/* Stats row */}
                <div className="stats-row">
                    <div className="stat-chip">
                        <BarChart3 size={13} />
                        <span>{dataPoints} data points</span>
                    </div>
                    <div className="stat-chip">
                        <Activity size={13} />
                        <span>{completedSteps.length}/{TOTAL_STEPS} checks</span>
                    </div>
                </div>

                {/* Terminal log */}
                <div className="terminal-log" ref={logRef}>
                    {completedSteps.map((idx) => (
                        <div key={idx} className="log-line done">
                            <CheckCircle size={11} />
                            <span>{crawlSteps[idx].msg}</span>
                        </div>
                    ))}
                    <div className="log-line current">
                        <span className="log-cursor">▸</span>
                        <span>{step.msg}{dots}</span>
                    </div>
                </div>

                {/* Step pips + dots */}
                <div className="progress-indicators">
                    <div className="step-indicators">
                        {crawlSteps.map((_, i) => (
                            <div
                                key={i}
                                className={`step-pip ${i === stepIndex ? 'active' : completedSteps.includes(i) ? 'done' : ''}`}
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
