// Infrastructure/CloudFormation/auth/apple-music/index.js

// Mock data store (simulating a database)
const mockUserLibrary = {
    playlists: [
      {
        id: "pl.mock1",
        name: "My Favorites",
        trackCount: 25,
        description: "Mock playlist for testing"
      },
      {
        id: "pl.mock2",
        name: "Workout Mix",
        trackCount: 15,
        description: "Mock workout playlist"
      }
    ],
    recentTracks: [
      {
        id: "track.mock1",
        name: "Mock Song 1",
        artist: "Mock Artist",
        playCount: 10
      },
      {
        id: "track.mock2",
        name: "Mock Song 2",
        artist: "Another Artist",
        playCount: 5
      }
    ]
  };
  
  // Security headers
  const SECURITY_HEADERS = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5174',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };
  
  // Generate mock developer token
  const generateMockToken = () => {
    const mockToken = Buffer.from(JSON.stringify({
      iss: 'mock-team-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15777000 // 6 months
    })).toString('base64');
  
    return `mock.${mockToken}.signature`;
  };
  
  // Validate request origin
  const validateOrigin = (origin) => {
    return origin === (process.env.ALLOWED_ORIGIN || 'http://localhost:5174');
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
  
      // Mock successful authentication response
      const mockResponse = {
        token: generateMockToken(),
        expiresIn: 15777000,
        mockData: mockUserLibrary // Include mock data for testing
      };
  
      return {
        statusCode: 200,
        headers: SECURITY_HEADERS,
        body: JSON.stringify(mockResponse)
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
  