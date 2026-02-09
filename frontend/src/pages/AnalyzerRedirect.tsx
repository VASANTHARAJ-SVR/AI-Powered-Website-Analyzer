import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeWebsite, analyzeMobile } from '../services/api';
import Loader from '../components/Loader';

export default function AnalyzerRedirect() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const url = params.get('url');
        const mode = params.get('mode') || 'desktop'; // 'desktop' | 'mobile'

        if (!url) {
            navigate('/');
            return;
        }

        const analyze = async () => {
            try {
                const result = mode === 'mobile'
                    ? await analyzeMobile(url)
                    : await analyzeWebsite({ url });

                // Redirect to dashboard with report ID
                setTimeout(() => {
                    navigate(`/dashboard/${result.reportId}`);
                }, 500);

            } catch (err: any) {
                console.error('Analysis failed:', err);
                setError(err.message || 'Analysis failed');

                // Redirect back to home after error
                setTimeout(() => {
                    navigate('/?error=' + encodeURIComponent(err.message || 'Analysis failed'));
                }, 3000);
            }
        };

        analyze();
    }, [params, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#1a1a2e] rounded-2xl shadow-2xl p-8 border border-red-500/30 text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-3">Analysis Failed</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting back...</p>
                </div>
            </div>
        );
    }

    return <Loader />;
}
