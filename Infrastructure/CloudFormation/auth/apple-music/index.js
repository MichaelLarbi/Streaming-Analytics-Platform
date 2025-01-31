exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    const headers = {
        'Access-Control-Allow-Origin': 'http://localhost:5174',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Mock successful response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                token: `mock-token-${Date.now()}`,
                expiresIn: 3600,
                mockData: {
                    status: 'success',
                    message: 'Mock Apple Music authentication successful'
                }
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    }
};
