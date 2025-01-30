// Infrastructure/CloudFormation/auth/apple-music/index.js

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // per window

// Security headers
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

// Generate Apple Music token
const generateToken = (privateKey, keyId, teamId) => {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 15777000, // 6 months
  };

  const header = {
    alg: 'ES256',
    kid: keyId
  };

  return jwt.sign(payload, privateKey, { 
    algorithm: 'ES256', 
    header: header 
  });
};

// Validate request origin
const validateOrigin = (origin) => {
  return origin === process.env.ALLOWED_ORIGIN;
};

// Main handler
exports.handler = async (event) => {
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: SECURITY_HEADERS,
      body: ''
    };
  }

  try {
    // Validate origin
    const origin = event.headers.origin || event.headers.Origin;
    if (!validateOrigin(origin)) {
      return {
        statusCode: 403,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({
          error: 'Invalid origin',
          message: 'Request origin not allowed'
        })
      };
    }

    // Generate token
    const token = generateToken(
      process.env.APPLE_PRIVATE_KEY,
      process.env.APPLE_KEY_ID,
      process.env.APPLE_TEAM_ID
    );

    return {
      statusCode: 200,
      headers: SECURITY_HEADERS,
      body: JSON.stringify({
        token,
        expiresIn: 15777000
      })
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: SECURITY_HEADERS,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      })
    };
  }
};
