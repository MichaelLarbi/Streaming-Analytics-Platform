// index.js
const { validateAppleMusicResponse } = require('./validation');

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  try {
    // Check if event.body exists and is a string
    if (!event.body) {
      console.error('No body found in event');
      throw new Error('No body provided in request');
    }

    let parsedBody;
    let dataType;

    try {
      // If body is a string, parse it
      if (typeof event.body === 'string') {
        parsedBody = JSON.parse(event.body);
      } else {
        parsedBody = event.body;
      }
      
      console.log('Parsed body:', JSON.stringify(parsedBody, null, 2));
      
      // Extract dataType from the parsed body
      dataType = parsedBody.dataType;
      
      if (!dataType) {
        throw new Error('dataType not provided in request body');
      }
    } catch (parseError) {
      console.error('Error parsing body:', parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    // Validate the incoming data
    const validationResult = validateAppleMusicResponse(parsedBody, dataType);
    console.log('Validation result:', JSON.stringify(validationResult, null, 2));
    
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
        error: error.message,
        stack: error.stack
      })
    };
  }
};
