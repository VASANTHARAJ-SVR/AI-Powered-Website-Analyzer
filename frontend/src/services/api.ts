// API service for backend communication
// import axios from 'axios';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ScanResult {
    url: string;
    scores: {
        overall: number;
        performance: number;
        seo: number;
        ux: number;
        content: number;
    };
    metrics: Record<string, any>;
    issues: Array<{
        id: string;
        type: 'error' | 'warning' | 'info';
        module: string;
        message: string;
        impact: string;
    }>;
}

export const analyzeUrl = async (url: string): Promise<ScanResult> => {
    // In a real scenario, this would POST to the backend
    // const response = await axios.post(`${API_URL}/analyze`, { url });
    // return response.data;

    // Mock response for now
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                url,
                scores: {
                    overall: Math.floor(Math.random() * 30) + 70,
                    performance: Math.floor(Math.random() * 30) + 70,
                    seo: Math.floor(Math.random() * 30) + 70,
                    ux: Math.floor(Math.random() * 30) + 70,
                    content: Math.floor(Math.random() * 30) + 70,
                },
                metrics: {
                    lcp: '2.4s',
                    cls: '0.05',
                },
                issues: [
                    { id: '1', type: 'error', module: 'SEO', message: 'Missing Meta Description', impact: 'High' },
                    { id: '2', type: 'warning', module: 'Performance', message: 'Large Layout Shift', impact: 'Medium' },
                    { id: '3', type: 'info', module: 'UX', message: 'Button contrast low', impact: 'Low' },
                ]
            });
        }, 2000);
    });
};
