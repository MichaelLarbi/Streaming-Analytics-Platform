const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const https = require('https');

// Initialize AWS DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Helper function to make HTTPS requests
const makeRequest = (url, options) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
};

// Generate Apple Music API token
const generateToken = (privateKey, keyId, teamId) => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // Token valid for 24 hours

  const payload = {
    iss: teamId,
    iat: now,
    exp: exp
  };

  const header = {
    alg: 'ES256',
    kid: keyId
  };

  return jwt.sign(payload, privateKey, { algorithm: 'ES256', header });
};

// Store data in DynamoDB
const storeData = async (data, tableName) => {
  const params = {
    TableName: tableName,
    Item: {
      id: `apple_music_${Date.now()}`,
      source: 'apple_music',
      timestamp: new Date().toISOString(),
      data: data
    }
  };

  await dynamoDB.put(params).promise();
};

// Mock data generator for development/testing
const generateMockData = () => {
  return {
    data: {
      analytics: {
        streams: 1000,
        listeners: 500,
        playlists: 50,
        topCountries: ['US', 'UK', 'CA'],
        trending: true
      },
      timestamp: new Date().toISOString()
    }
  };
};

// Main handler function
exports.handler = async (event) => {
  try {
    // Check if we're in mock mode (no real credentials)
    const isMockMode = !process.env.PRIVATE_KEY || 
                      process.env.PRIVATE_KEY === 'mock_private_key';

    let data;
    
    if (isMockMode) {
      console.log('Running in mock mode - generating mock data');
      data = generateMockData();
    } else {
      // Get Apple Music credentials from environment variables
      const { 
        PRIVATE_KEY,
        KEY_ID,
        TEAM_ID,
        TABLE_NAME
      } = process.env;

      // Generate Apple Music API token
      const token = generateToken(PRIVATE_KEY, KEY_ID, TEAM_ID);

      // Configure request headers
      const options = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Fetch data from Apple Music API
      data = await makeRequest('https://api.music.apple.com/v1/catalog/analytics', options);
    }

    // Store data in DynamoDB
    await storeData(data, process.env.TABLE_NAME || 'streaming-analytics-dev-raw-streaming-data');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Data fetched and stored successfully',
        timestamp: new Date().toISOString(),
        mode: isMockMode ? 'mock' : 'live'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
