const https = require('https');

// Configuration
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5174/spotify-auth';
const ALLOWED_ORIGIN = 'http://localhost:5174';

// Rate limiting (basic in-memory implementation)
const TOKEN_REQUESTS = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // per window

const validateInput = (code) => {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid authorization code format');
  }
  if (code.length < 10) {
    throw new Error('Authorization code too short');
  }
  // Basic format validation for Spotify auth codes
  if (!/^AQ[A-Za-z0-9_-]{10,}$/.test(code)) {
    throw new Error('Invalid authorization code format');
  }
};

const checkRateLimit = (ip) => {
  const now = Date.now();
  const userRequests = TOKEN_REQUESTS.get(ip) || [];
  
  // Clear old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  TOKEN_REQUESTS.set(ip, recentRequests);
};

const exchangeCodeForToken = async (code) => {
  return new Promise((resolve, reject) => {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const options = {
      hostname: 'accounts.spotify.com',
      path: '/api/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    };

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }).toString();

    console.log('Token exchange request:', {
      uri: 'https://accounts.spotify.com/api/token',
      hasAuthHeader: true,
      bodyParams: ['grant_type', 'code', 'redirect_uri']
    });

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.access_token) {
            console.log('Token exchange successful');
            resolve(response);
          } else {
            console.error('Token exchange failed:', response);
            reject(new Error(response.error_description || 'Token exchange failed'));
          }
        } catch (error) {
          console.error('Response parsing error:', error);
          reject(new Error('Invalid response format'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(body);
    req.end();
  });
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Security headers
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store'
  };
  
  try {
    // Validate origin
    const origin = event.headers.origin || event.headers.Origin;
    if (origin !== ALLOWED_ORIGIN) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid origin' })
      };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Check rate limit
    const clientIp = event.requestContext.identity.sourceIp;
    checkRateLimit(clientIp);

    const code = event?.queryStringParameters?.code;
    
    // Validate input
    try {
      validateInput(code);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          message: error.message
        })
      };
    }

    // Exchange code for token
    try {
      const tokens = await exchangeCodeForToken(code);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(tokens)
      };
    } catch (error) {
      const statusCode = error.message.includes('Rate limit') ? 429 : 400;
      return {
        statusCode,
        headers,
        body: JSON.stringify({
          error: 'Token exchange failed',
          message: error.message
        })
      };
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      })
    };
  }
};