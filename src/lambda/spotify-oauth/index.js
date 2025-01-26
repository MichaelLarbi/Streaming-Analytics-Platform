const AWS = require('aws-sdk');
const https = require('https');
const querystring = require('querystring');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { code } = JSON.parse(event.body);
    
    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    
    // Store token in DynamoDB
    await storeToken(tokenResponse);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: tokenResponse.access_token
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function exchangeCodeForToken(code) {
  const params = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(params);
    req.end();
  });
}

async function storeToken(tokenData) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      userId: tokenData.scope,  // You might want to use a real user ID here
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    }
  };

  await dynamoDB.put(params).promise();
}
