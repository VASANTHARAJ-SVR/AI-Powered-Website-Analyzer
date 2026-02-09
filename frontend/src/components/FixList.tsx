interface Fix {
    id: string;
    issue_id: string;
    title: string;
    description: string;
    effort_hours: number;
    impact_pct: number;
    priority: number;
    module?: string;
}

interface FixListProps {
    fixes: Fix[];
}

export default function FixList({ fixes }: FixListProps) {
    if (!fixes || fixes.length === 0) {
        return (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    🎉
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Critical Fixes Needed!</h3>
                <p className="text-gray-500">Your website is in great shape. Keep monitoring for improvements.</p>
            </div>
        );
    }

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return 'bg-red-50 text-red-700 border-red-200';
            case 2: return 'bg-orange-50 text-orange-700 border-orange-200';
            case 3: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 1: return 'Critical';
            case 2: return 'High';
            case 3: return 'Medium';
            default: return 'Low';
        }
    };

    return (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-xl">🔧</span>
                Top Priority Fixes
            </h3>

            <div className="space-y-4">
                {fixes.map((fix, idx) => (
                    <div
                        key={fix.id || idx}
                        className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(fix.priority)}`}>
                                        Priority {fix.priority} - {getPriorityLabel(fix.priority)}
                                    </span>
                                    {fix.module && (
                                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 font-medium">
                                            {fix.module}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                    {idx + 1}. {fix.title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    {fix.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">Impact:</span>
                                <span className="text-green-600 font-bold">{fix.impact_pct}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">Effort:</span>
                                <span className="text-blue-600 font-bold">{fix.effort_hours}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">ROI:</span>
                                <span className="text-purple-600 font-bold">
                                    {(fix.impact_pct / fix.effort_hours).toFixed(1)}
                                </span>
                            </div>
                            {fix.description.includes('http') && (
                                <a
                                    href={fix.description.match(/https?:\/\/[^\s]+/)?.[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center gap-1"
                                >
                                    Learn more →
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
