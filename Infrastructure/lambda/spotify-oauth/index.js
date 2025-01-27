exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
  
  try {
    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: headers,
        body: ''
      };
    }
    
    // Handle both GET and POST methods
    let code;
    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      code = queryParams.code;
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      code = body.code;
    }
    
    if (!code) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: 'Missing authorization code' })
      };
    }
    
    // For testing, return a mock token
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        access_token: 'mock_token',
        token_type: 'Bearer'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};