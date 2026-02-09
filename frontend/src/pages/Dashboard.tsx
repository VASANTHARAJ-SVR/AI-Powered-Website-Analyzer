import { useParams, useNavigate } from 'react-router-dom';
import { useReport } from '../hooks/useReport';
import OverviewCard from '../components/OverviewCard';
import ModuleCard from '../components/ModuleCard';
import FixList from '../components/FixList';
import Loader from '../components/Loader';

export default function Dashboard() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { report, loading, error } = useReport(reportId);

    if (loading) return <Loader />;

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-50 text-red-500 rounded-full">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Report</h2>
                    <p className="text-gray-500 mb-8">{error || 'Report not found'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Collect all fixes from all modules
    const allFixes = [
        ...(report.modules.performance?.fixes || []).map((f: any) => ({ ...f, module: 'Performance' })),
        ...(report.modules.ux?.fixes || []).map((f: any) => ({ ...f, module: 'UX' })),
        ...(report.modules.seo?.fixes || []).map((f: any) => ({ ...f, module: 'SEO' })),
        ...(report.modules.content?.fixes || []).map((f: any) => ({ ...f, module: 'Content' }))
    ];

    // Sort by priority, then by impact
    allFixes.sort((a, b) => a.priority - b.priority || b.impact_pct - a.impact_pct);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full">
                                Analysis Complete
                            </span>
                            <span className="text-slate-500 text-sm">
                                {new Date(report.created_at).toLocaleDateString()} • {new Date(report.created_at).toLocaleTimeString()}
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Website Audit Report
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Start New Audit
                    </button>
                </div>

                {/* Overview Card */}
                <OverviewCard
                    score={report.aggregator?.website_health_score || 0}
                    grade={report.aggregator?.health_grade || 'N/A'}
                    url={report.url || 'Unknown'}
                    riskDomains={report.aggregator?.dominant_risk_domains || []}
                    actionRecommendation={report.aggregator?.action_recommendation_flag || 'review'}
                    moduleScores={report.aggregator?.module_scores}
                />

                {/* Module Cards Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Detailed Breakdown</h2>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <ModuleCard
                            title="Performance"
                            data={report.modules.performance}
                        />
                        <ModuleCard
                            title="UX & Accessibility"
                            data={report.modules.ux}
                        />
                        <ModuleCard
                            title="SEO"
                            data={report.modules.seo}
                        />
                        <ModuleCard
                            title="Content"
                            data={report.modules.content}
                        />
                    </div>
                </div>

                {/* Fix List */}
                <FixList fixes={allFixes.slice(0, 10)} />

                {/* Report Metadata */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Report Metadata</h3>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div>
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block mb-1">ID</span>
                            <span className="text-slate-900 font-mono text-sm">{report._id}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block mb-1">Status</span>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-900 capitalize font-medium">{report.status}</span>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block mb-1">Duration</span>
                            <span className="text-slate-900 font-medium">
                                {((new Date(report.finished_at).getTime() - new Date(report.created_at).getTime()) / 1000).toFixed(1)}s
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block mb-1">Final URL</span>
                        <a href={report.final_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">{report.final_url}</a>
                    </div>
                </div>

                {/* Footer spacing */}
                <div className="h-8"></div>
            </div>
        </div>
    );
}



