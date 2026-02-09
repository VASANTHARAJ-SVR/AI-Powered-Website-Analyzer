interface OverviewCardProps {
    score: number;
    grade: string;
    url: string;
    riskDomains: string[];
    actionRecommendation: string;
    moduleScores?: {
        performance: number;
        ux: number;
        seo: number;
        content: number;
    };
}

export default function OverviewCard({
    score,
    grade,
    url,
    riskDomains,
    actionRecommendation,
    moduleScores
}: OverviewCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-amber-600';
        if (score >= 35) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 70) return 'bg-blue-500';
        if (score >= 50) return 'bg-amber-500';
        if (score >= 35) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getStrokeColor = (score: number) => {
        if (score >= 90) return '#10b981';
        if (score >= 70) return '#3b82f6';
        if (score >= 50) return '#f59e0b';
        if (score >= 35) return '#f97316';
        return '#ef4444';
    };

    return (
        <div className="space-y-6">
            {/* Main Score Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                    {/* Score Circle */}
                    <div className="flex-shrink-0">
                        <div className="relative w-48 h-48">
                            <svg className="w-48 h-48 transform -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="#e2e8f0"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke={getStrokeColor(score)}
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${(score / 100) * 553} 553`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</div>
                                <div className="text-sm font-semibold text-slate-500 mt-1">Grade {grade}</div>
                            </div>
                        </div>
                    </div>

                    {/* URL and Info */}
                    <div className="flex-1 text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Website Health Score</h2>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg mb-4 border border-slate-200">
                            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors truncate max-w-md"
                            >
                                {url}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Module Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Performance */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Performance</div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className={`text-4xl font-bold mb-3 ${getScoreColor(moduleScores?.performance || 0)}`}>
                        {moduleScores?.performance || 0}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getScoreBgColor(moduleScores?.performance || 0)} transition-all duration-1000 rounded-full`}
                            style={{ width: `${moduleScores?.performance || 0}%` }}
                        ></div>
                    </div>
                </div>

                {/* UX & Access */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">UX & Access</div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <div className={`text-4xl font-bold mb-3 ${getScoreColor(moduleScores?.ux || 0)}`}>
                        {moduleScores?.ux || 0}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getScoreBgColor(moduleScores?.ux || 0)} transition-all duration-1000 rounded-full`}
                            style={{ width: `${moduleScores?.ux || 0}%` }}
                        ></div>
                    </div>
                </div>

                {/* SEO */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">SEO</div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className={`text-4xl font-bold mb-3 ${getScoreColor(moduleScores?.seo || 0)}`}>
                        {moduleScores?.seo || 0}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getScoreBgColor(moduleScores?.seo || 0)} transition-all duration-1000 rounded-full`}
                            style={{ width: `${moduleScores?.seo || 0}%` }}
                        ></div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Content</div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className={`text-4xl font-bold mb-3 ${getScoreColor(moduleScores?.content || 0)}`}>
                        {moduleScores?.content || 0}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getScoreBgColor(moduleScores?.content || 0)} transition-all duration-1000 rounded-full`}
                            style={{ width: `${moduleScores?.content || 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Risk Domains */}
                {riskDomains.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Risk Domains</h3>
                                <p className="text-sm text-slate-600">Areas requiring attention</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {riskDomains.map((domain, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-200"
                                >
                                    {domain}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Recommendation */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Recommended Action</h3>
                            <p className="text-sm text-slate-600">Next steps</p>
                        </div>
                    </div>
                    <p className="text-slate-700 font-medium capitalize px-4 py-3 bg-blue-50 rounded-lg">
                        {actionRecommendation.replace(/_/g, ' ')}
                    </p>
                </div>
            </div>
        </div>
    );
}