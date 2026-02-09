import { useEffect, useState } from 'react';
import { getReport, type Report } from '../services/api';

export function useReport(reportId: string | undefined) {
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!reportId) {
            setLoading(false);
            return;
        }

        const fetchReport = async () => {
            try {
                setLoading(true);
                const data = await getReport(reportId);
                setReport(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch report');
                setReport(null);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    return { report, loading, error };
}
