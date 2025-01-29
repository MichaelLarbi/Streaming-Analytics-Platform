
// lambda/spotify-refresh/index.js
const https = require('https');

exports.handler = async (event) => {
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { refresh_token } = body;

        if (!refresh_token) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'refresh_token is required' })
            };
        }

        // Token refresh request to Spotify
        const tokenResponse = await new Promise((resolve, reject) => {
            const requestBody = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }).toString();

            const options = {
                hostname: 'accounts.spotify.com',
                path: '/api/token',
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(
                        SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET
                    ).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });

            req.on('error', reject);
            req.write(requestBody);
            req.end();
        });

        return {
            statusCode: tokenResponse.status,
            headers,
            body: tokenResponse.data
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
