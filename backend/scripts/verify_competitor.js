/**
 * Verify Competitor Analysis Route
 * Usage: node scripts/verify_competitor.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

async function verify() {
    console.log(`🔍 Verifying Competitor Analysis Endpoint at ${BASE_URL}...`);

    try {
        // 1. Check Health
        const health = await fetch(`${BASE_URL}/api/health`);
        if (!health.ok) {
            console.error('❌ Backend server is not reachable!');
            return;
        }
        console.log('✅ Backend is reachable');

        // 2. Check Competitor Route (We expect 400 Bad Request because we don't send reportId)
        // If we get 404, it means route doesn't exist
        const response = await fetch(`${BASE_URL}/api/competitor/analyze-3-1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Empty body
        });

        if (response.status === 404) {
            console.error('❌ Route /api/competitor/analyze-3-1 NOT FOUND (404)');
            console.error('👉 ACTION: You must RESTART the backend server!');
        } else if (response.status === 400) {
            const data = await response.json();
            if (data.error === 'userReportId is required') {
                console.log('✅ Competitor Endpoint is ACTIVE and responding correctly!');
            } else {
                console.log(`⚠️ Endpoint responded with 400 but unexpected error: ${data.error}`);
            }
        } else {
            console.log(`❓ Endpoint responded with ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Network Error:', error.message);
        console.error('👉 Make sure server is running on port 4000');
    }
}

verify();
