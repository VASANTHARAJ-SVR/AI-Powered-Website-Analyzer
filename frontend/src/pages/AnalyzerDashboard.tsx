import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Zap, Search, Smartphone, FileText, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import './AnalyzerDashboard.css';

const GRADE_TABLE = [
    {
        grade: 'A+',
        range: '90 – 100',
        color: '#10B981',
        desc: 'Excellent website health. Fully optimized across SEO, Performance, UX, Accessibility, and Content. Meets industry best practices. Very few or no issues found.'
    },
    {
        grade: 'A',
        range: '80 – 89',
        color: '#34D399',
        desc: 'Strong website quality. Minor improvements needed. Performs well in most areas but can benefit from small optimizations.'
    },
    {
        grade: 'B',
        range: '70 – 79',
        color: '#FBBF24',
        desc: 'Good, but noticeable issues exist. Some SEO gaps, performance bottlenecks, or UX/accessibility problems require attention.'
    },
    {
        grade: 'C',
        range: '60 – 69',
        color: '#F59E0B',
        desc: 'Below average website health. Contains multiple issues affecting user experience and visibility. Improvements needed across several modules.'
    },
    {
        grade: 'D',
        range: '45 – 59',
        color: '#F97316',
        desc: 'Poor website performance and SEO. Major errors, slow load times, accessibility failures, or content problems significantly impacting conversions.'
    },
    {
        grade: 'E',
        range: '30 – 44',
        color: '#EF4444',
        desc: 'Critical issues. Website likely difficult to use, slow, and poorly optimized. High bounce rates expected. Needs urgent fixes.'
    },
    {
        grade: 'F',
        range: '0 – 29',
        color: '#DC2626',
        desc: 'Website is severely broken, unoptimized, or unusable. Missing essential SEO/UX/Performance standards. Immediate rebuilding or overhaul recommended.'
    }
];

function getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    if (score >= 30) return 'E';
    return 'F';
}

const MOCK_REPORT = {
    url: "https://example.com",
    scores: {
        overall: 78,
        performance: 82,
        seo: 90,
        ux: 65,
        content: 75
    },
    metrics: {
        lcp: 2.4,
        cls: 0.05,
        fid: 120,
        ttfb: 0.3
    },
    issues: [
        { id: 1, type: 'error', module: 'SEO', message: 'Missing Meta Description', impact: 'High' },
        { id: 2, type: 'warning', module: 'Performance', message: 'Large Layout Shift detected', impact: 'Medium' },
        { id: 3, type: 'info', module: 'UX', message: 'Contrast ratio on buttons could be better', impact: 'Low' },
    ]
};

export function AnalyzerDashboard() {
    const [searchParams] = useSearchParams();
    const url = searchParams.get('url');
    const navigate = useNavigate();
    const [report, setReport] = useState<typeof MOCK_REPORT | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setReport(MOCK_REPORT);
            setLoading(false);
        }, 2000);
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Analyzing website...</p>
            </div>
        );
    }

    if (!report) return <div className="error-message">Failed to load report.</div>;

    const overallGrade = getGrade(report.scores.overall);
    const overallMeta = GRADE_TABLE.find((row) => row.grade === overallGrade);

    const MODULE_ICONS: Record<string, React.ReactNode> = {
        Performance: <Zap size={18} />,
        SEO: <Search size={18} />,
        UX: <Smartphone size={18} />,
        Content: <FileText size={18} />,
    };

    const MODULE_COLORS: Record<string, string> = {
        Performance: '#00C49F',
        SEO: '#6366F1',
        UX: '#F59E0B',
        Content: '#EC4899',
    };

    const moduleScores = [
        { name: 'Performance', value: report.scores.performance },
        { name: 'SEO', value: report.scores.seo },
        { name: 'UX', value: report.scores.ux },
        { name: 'Content', value: report.scores.content },
    ];

    return (
        <div className="dashboard">
            <div className="container dashboard-container">
                {/* ── Header ── */}
                <div className="dashboard-header">
                    <div className="dashboard-header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>
                        <div className="dashboard-header-info">
                            <h1 className="dashboard-title">
                                <Shield size={22} className="title-icon" />
                                Website Audit
                            </h1>
                            <p className="dashboard-url">
                                <Globe size={14} />
                                <span>{url}</span>
                            </p>
                        </div>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-outline">Download PDF</button>
                        <button className="btn btn-primary">Re-scan</button>
                    </div>
                </div>

                {/* ── Grade Hero ── */}
                <div className="grade-hero">
                    <div className="grade-hero-ring-wrap">
                        <div className="grade-hero-glow" style={{ background: `radial-gradient(circle, ${overallMeta?.color}25 0%, transparent 70%)` }} />
                        <div className="grade-hero-ring" style={{ borderColor: overallMeta?.color }}>
                            <span className="grade-hero-letter" style={{ color: overallMeta?.color }}>
                                {overallGrade}
                            </span>
                        </div>
                    </div>
                    <div className="grade-hero-details">
                        <span className="grade-hero-eyebrow">Overall Grade</span>
                        <div className="grade-hero-score-row">
                            <span className="grade-hero-score">{report.scores.overall}</span>
                            <span className="grade-hero-max">/ 100</span>
                            <span className="grade-hero-tag" style={{ backgroundColor: `${overallMeta?.color}18`, color: overallMeta?.color, borderColor: `${overallMeta?.color}40` }}>
                                <TrendingUp size={12} />
                                {overallMeta?.grade === 'A+' || overallMeta?.grade === 'A' ? 'Excellent' : overallMeta?.grade === 'B' ? 'Good' : overallMeta?.grade === 'C' ? 'Average' : 'Needs Work'}
                            </span>
                        </div>
                        <p className="grade-hero-desc">{overallMeta?.desc}</p>
                    </div>
                </div>

                {/* ── Module Scores ── */}
                <div className="dash-section-header">
                    <span className="dash-section-label">Audit Results</span>
                    <h2 className="dash-section-title">Module <span className="accent">Breakdown</span></h2>
                    <p className="dash-section-subtitle">Individual scores across all audit categories</p>
                </div>
                <div className="grade-modules">
                    {moduleScores.map((module) => {
                        const grade = getGrade(module.value);
                        const meta = GRADE_TABLE.find((row) => row.grade === grade);
                        const modColor = MODULE_COLORS[module.name] || '#aee92b';
                        return (
                            <div key={module.name} className="grade-module-card">
                                <div className="module-card-top">
                                    <div className="module-icon" style={{ backgroundColor: `${modColor}15`, color: modColor }}>
                                        {MODULE_ICONS[module.name]}
                                    </div>
                                    <span
                                        className="grade-badge"
                                        style={{ backgroundColor: `${meta?.color}18`, color: meta?.color, borderColor: `${meta?.color}40` }}
                                    >
                                        {grade}
                                    </span>
                                </div>
                                <p className="grade-module-name">{module.name}</p>
                                <div className="module-progress-wrap">
                                    <div className="module-progress-bar">
                                        <div
                                            className="module-progress-fill"
                                            style={{ width: `${module.value}%`, backgroundColor: modColor }}
                                        />
                                    </div>
                                    <span className="module-progress-num" style={{ color: modColor }}>{module.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Grade Scale Table ── */}
                <div className="dash-section-header">
                    <span className="dash-section-label">Reference</span>
                    <h2 className="dash-section-title">Grading <span className="accent">Scale</span></h2>
                    <p className="dash-section-subtitle">How we evaluate your website's overall health</p>
                </div>
                <div className="grade-table-wrapper">
                    <table className="grade-table">
                        <thead>
                            <tr>
                                <th>Grade</th>
                                <th>Score Range</th>
                                <th className="th-desc">Meaning / Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {GRADE_TABLE.map((row) => {
                                const isCurrent = row.grade === overallGrade;
                                return (
                                    <tr key={row.grade} className={isCurrent ? 'grade-row--active' : ''}>
                                        <td>
                                            <span
                                                className="grade-badge grade-badge--lg"
                                                style={{ backgroundColor: `${row.color}18`, color: row.color, borderColor: `${row.color}40` }}
                                            >
                                                {row.grade}
                                            </span>
                                        </td>
                                        <td className="grade-range">{row.range}</td>
                                        <td className="grade-desc">
                                            {row.desc}
                                            {isCurrent && (
                                                <span className="current-indicator">
                                                    <ChevronRight size={12} />
                                                    Your score
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
