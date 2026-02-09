import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeWebsite } from '../services/api';

export default function AnalyzerRedirect() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Initializing analysis...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const url = params.get('url');

        if (!url) {
            navigate('/');
            return;
        }

        const analyze = async () => {
            try {
                setStatus('Starting scraper...');
                setProgress(10);

                const result = await analyzeWebsite({ url });

                setStatus('Analysis complete!');
                setProgress(100);

                // Redirect to dashboard with report ID
                setTimeout(() => {
                    navigate(`/dashboard/${result.reportId}`);
                }, 500);

            } catch (err: any) {
                console.error('Analysis failed:', err);
                setStatus('Analysis failed: ' + (err.message || 'Unknown error'));

                // Redirect back to home after error
                setTimeout(() => {
                    navigate('/?error=' + encodeURIComponent(err.message || 'Analysis failed'));
                }, 3000);
            }
        };

        analyze();
    }, [params, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#1a1a2e] rounded-2xl shadow-2xl p-8 border border-gray-700">
                <div className="text-center">
                    {/* Animated spinner */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">
                        Analyzing Website
                    </h2>

                    <p className="text-gray-400 mb-6">
                        {status}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <p className="text-sm text-gray-500">
                        This may take 30-60 seconds...
                    </p>
                </div>
            </div>
        </div>
    );
}
