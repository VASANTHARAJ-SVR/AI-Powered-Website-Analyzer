import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AlertTriangle, XCircle, Info, ArrowLeft } from 'lucide-react';
import './AnalyzerDashboard.css';

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

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

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

    const data = [
        { name: 'Performance', value: report.scores.performance },
        { name: 'SEO', value: report.scores.seo },
        { name: 'UX', value: report.scores.ux },
        { name: 'Content', value: report.scores.content },
    ];

    return (
        <div className="dashboard">
            <div className="container dashboard-container">
                <div className="dashboard-header">
                    <div className="dashboard-header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>
                        <div>
                            <h1 className="dashboard-title">Audit Report</h1>
                            <p className="dashboard-url">{url}</p>
                        </div>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-outline">Download PDF</button>
                        <button className="btn btn-primary">Re-scan</button>
                    </div>
                </div>

                <div className="score-section">
                    <div className="score-card overall-score">
                        <h2 className="score-title">Overall Health</h2>
                        <div className="score-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ value: report.scores.overall }, { value: 100 - report.scores.overall }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill={report.scores.overall >= 80 ? '#10B981' : report.scores.overall >= 50 ? '#F59E0B' : '#EF4444'} />
                                        <Cell fill="#E5E7EB" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="score-value">
                                <span className="score-number">{report.scores.overall}</span>
                                <span className="score-label">SCORE</span>
                            </div>
                        </div>
                    </div>

                    <div className="score-card breakdown-card">
                        <h2 className="score-title">Category Breakdown</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                    {data.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="issues-section card">
                    <div className="issues-header">
                        <h3 className="issues-title">Issues Found</h3>
                    </div>
                    <div className="issues-list">
                        {report.issues.map((issue) => (
                            <div key={issue.id} className="issue-item">
                                {issue.type === 'error' && <XCircle className="issue-icon error" />}
                                {issue.type === 'warning' && <AlertTriangle className="issue-icon warning" />}
                                {issue.type === 'info' && <Info className="issue-icon info" />}
                                <div className="issue-content">
                                    <h4 className="issue-message">{issue.message}</h4>
                                    <div className="issue-meta">
                                        <span className="issue-badge">{issue.module}</span>
                                        <span className="issue-impact">Impact: {issue.impact}</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline btn-sm">Fix</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
