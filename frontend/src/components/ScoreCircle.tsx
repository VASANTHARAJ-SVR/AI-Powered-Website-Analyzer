interface ScoreCircleProps {
    score: number;
    grade: string;
    size?: number;
}

export default function ScoreCircle({ score, grade, size = 180 }: ScoreCircleProps) {
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return { text: 'text-emerald-400', stroke: 'stroke-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/20' };
            case 'B': return { text: 'text-blue-400', stroke: 'stroke-blue-400', bg: 'from-blue-500/20 to-blue-600/20' };
            case 'C': return { text: 'text-yellow-400', stroke: 'stroke-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/20' };
            case 'D': return { text: 'text-orange-400', stroke: 'stroke-orange-400', bg: 'from-orange-500/20 to-orange-600/20' };
            case 'F': return { text: 'text-red-400', stroke: 'stroke-red-400', bg: 'from-red-500/20 to-red-600/20' };
            default: return { text: 'text-gray-400', stroke: 'stroke-gray-400', bg: 'from-gray-500/20 to-gray-600/20' };
        }
    };

    const colors = getGradeColor(grade);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            {/* Animated SVG Circle */}
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className="stroke-gray-700/30"
                    strokeWidth="12"
                />
                {/* Progress circle with animation */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className={`${colors.stroke} transition-all duration-1000 ease-out`}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        filter: 'drop-shadow(0 0 8px currentColor)',
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-bold ${colors.text} animate-fade-in`}>
                    {score}
                </div>
                <div className={`text-lg font-semibold ${colors.text} mt-1 opacity-90`}>
                    Grade {grade}
                </div>
            </div>
        </div>
    );
}
