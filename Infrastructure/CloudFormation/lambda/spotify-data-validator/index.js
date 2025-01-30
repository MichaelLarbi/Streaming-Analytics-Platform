// /Infrastructure/CloudFormation/lambda/spotify-data-validator/index.js

const { validateSpotifyResponse } = require('./validation');

exports.handler = async (event) => {
  try {
    const { body, dataType } = JSON.parse(event.body);
    
    // Validate the incoming data
    const validationResult = validateSpotifyResponse(body, dataType);
    
    if (!validationResult.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Validation failed',
          errors: validationResult.errors
        })
      };
    }
    
    // Return the sanitized data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Validation successful',
        data: validationResult.sanitizedData
      })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
