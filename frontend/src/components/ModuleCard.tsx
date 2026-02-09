interface ModuleCardProps {
    title: string;
    data: any;
}

export default function ModuleCard({ title, data }: ModuleCardProps) {
    if (!data) return null;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400';
        if (score >= 70) return 'text-blue-400';
        if (score >= 50) return 'text-yellow-400';
        if (score >= 35) return 'text-orange-400';
        return 'text-red-400';
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 text-red-700 border-red-200';
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                </h3>
                <div className={`text-3xl font-bold ${getScoreColor(data.score)}`}>
                    {data.score}
                </div>
            </div>

            {/* Module-specific metrics */}
            <div className="space-y-3 mb-4">
                {/* Performance metrics */}
                {title === 'Performance' && (
                    <>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">LCP:</span>
                            <span className="text-gray-900 font-mono">
                                {data.metrics?.lcp_s ? `${data.metrics.lcp_s.toFixed(2)}s` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">CLS:</span>
                            <span className="text-gray-900 font-mono">
                                {data.metrics?.cls !== undefined ? data.metrics.cls.toFixed(3) : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">TTFB:</span>
                            <span className="text-gray-900 font-mono">
                                {data.metrics?.ttfb_s ? `${data.metrics.ttfb_s.toFixed(2)}s` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Confidence:</span>
                            <span className="text-gray-900 capitalize">{data.confidence || 'N/A'}</span>
                        </div>
                    </>
                )}

                {/* UX metrics */}
                {title === 'UX & Accessibility' && (
                    <>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Violations:</span>
                            <span className="text-gray-900">{data.violations_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Critical:</span>
                            <span className="text-red-500 font-medium">{data.violations_by_impact?.critical || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Serious:</span>
                            <span className="text-orange-500 font-medium">{data.violations_by_impact?.serious || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">CTAs Above Fold:</span>
                            <span className="text-gray-900">{data.ctas_above_fold || 0}</span>
                        </div>
                    </>
                )}

                {/* SEO metrics */}
                {title === 'SEO' && (
                    <>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Indexability:</span>
                            <span className="text-gray-900 capitalize">{data.indexability_status || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Title Length:</span>
                            <span className="text-gray-900">{data.title_length || 0} chars</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">H1 Count:</span>
                            <span className="text-gray-900">{data.h1_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Missing Alt:</span>
                            <span className="text-gray-900">{data.images_missing_alt_count || 0}</span>
                        </div>
                    </>
                )}

                {/* Content metrics */}
                {title === 'Content' && (
                    <>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Word Count:</span>
                            <span className="text-gray-900">{data.word_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Depth:</span>
                            <span className="text-gray-900 capitalize">{data.content_depth_status || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Readability:</span>
                            <span className="text-gray-900">
                                {data.flesch_reading_ease ? data.flesch_reading_ease.toFixed(1) : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-500">Intent Match:</span>
                            <span className="text-gray-900 capitalize">{data.intent_match_level || 'N/A'}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Issues */}
            {data.issues && data.issues.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issues Found</span>
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{data.issues.length}</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {data.issues.slice(0, 3).map((issue: any, idx: number) => (
                            <div
                                key={idx}
                                className={`text-xs px-2.5 py-1.5 rounded-md border ${getSeverityColor(issue.severity)} flex items-start gap-2`}
                            >
                                <span className="flex-1 leading-relaxed">{issue.description || issue.id}</span>
                            </div>
                        ))}
                        {data.issues.length > 3 && (
                            <div className="text-xs text-center py-1">
                                <span className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                                    +{data.issues.length - 3} more issues
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
