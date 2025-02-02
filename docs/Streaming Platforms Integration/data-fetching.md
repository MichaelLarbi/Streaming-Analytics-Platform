# Streaming Platform Data Fetcher Implementation Guide

## Overview
This document provides a step-by-step guide for implementing new streaming platform data fetchers in the Streaming Analytics Platform, based on the existing Spotify and Apple Music implementations.

## File Structure
```
Infrastructure/CloudFormation/lambda/{platform}-data-fetcher/
├── index.js                    # Lambda function code
├── package.json               # Node.js dependencies
├── test-event.json           # Test event for Lambda
└── dynamodb-template.yaml    # DynamoDB table template
```

## Step 1: Create Lambda Function Code
Create `index.js` with this template:

```javascript
const AWS = require('aws-sdk');
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

// Store data in DynamoDB
const storeData = async (data, tableName) => {
  const params = {
    TableName: tableName,
    Item: {
      id: `${platform}_${Date.now()}`,
      source: platform,
      timestamp: new Date().toISOString(),
      data: data
    }
  };

  await dynamoDB.put(params).promise();
};

// Main handler function
exports.handler = async (event) => {
  try {
    // Check if we're in mock mode
    const isMockMode = !process.env.API_KEY || 
                      process.env.API_KEY === 'mock_key';

    let data;
    
    if (isMockMode) {
      console.log('Running in mock mode - generating mock data');
      data = generateMockData();
    } else {
      // Get API credentials from environment variables
      const { API_KEY, TABLE_NAME } = process.env;

      // Configure request headers
      const options = {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      };

      // Fetch data from platform API
      data = await makeRequest('https://api.platform.com/analytics', options);
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
```

## Step 2: Create package.json
```json
{
  "name": "platform-data-fetcher",
  "version": "1.0.0",
  "description": "Lambda function to fetch data from streaming platform API",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1450.0"
  }
}
```

## Step 3: Create DynamoDB Template
Create `dynamodb-template.yaml`:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for Raw Streaming Data DynamoDB table'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
    Description: 'Environment name for resource naming'

  ProjectName:
    Type: String
    Default: 'streaming-analytics'
    Description: 'Base name for the project resources'

Resources:
  RawStreamingDataTable:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: !Sub '${ProjectName}-${Environment}-raw-streaming-data'
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: source
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: source-timestamp-index
          KeySchema:
            - AttributeName: source
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
```

## Step 4: Create Test Event
Create `test-event.json`:
```json
{
  "resource": "/platform",
  "path": "/platform",
  "httpMethod": "GET",
  "headers": {
    "Accept": "*/*",
    "Host": "api.example.com",
    "User-Agent": "TestClient/1.0"
  },
  "requestContext": {
    "resourceId": "123456",
    "resourcePath": "/platform",
    "httpMethod": "GET",
    "requestTime": "01/Feb/2025:12:00:00 +0000",
    "path": "/dev/platform",
    "protocol": "HTTP/1.1",
    "stage": "dev"
  }
}
```

## Implementation Steps

1. **Create Directory Structure**
```bash
cd /Users/michaellarbi/Streaming-Analytics-Platform/Streaming-Analytics-Platform
mkdir -p Infrastructure/CloudFormation/lambda/{platform}-data-fetcher
```

2. **Create Feature Branch**
```bash
git checkout -b feature/SAP-XX-{platform}-data-fetcher
```

3. **Add Implementation Files**
```bash
cd Infrastructure/CloudFormation/lambda/{platform}-data-fetcher
# Create files using templates above
npm install
```

4. **Deploy Infrastructure**
```bash
# Deploy DynamoDB (if not exists)
aws cloudformation update-stack --stack-name streaming-analytics-dynamodb --template-body file:///Users/michaellarbi/Streaming-Analytics-Platform/Streaming-Analytics-Platform/Infrastructure/CloudFormation/lambda/{platform}-data-fetcher/dynamodb-template.yaml --parameters ParameterKey=Environment,ParameterValue=dev ParameterKey=ProjectName,ParameterValue=streaming-analytics --region eu-west-2

# Create deployment package
zip -r function.zip index.js node_modules package.json

# Deploy Lambda
aws lambda update-function-code \
  --function-name streaming-analytics-dev-{platform}-data-fetcher \
  --zip-file fileb://function.zip \
  --region eu-west-2
```

5. **Test Implementation**
```bash
aws lambda invoke \
  --function-name streaming-analytics-dev-{platform}-data-fetcher \
  --payload file://test-event.json \
  --cli-binary-format raw-in-base64-out \
  --region eu-west-2 \
  response.json
```

6. **Commit Changes**
```bash
git add .
git commit -m "SAP-XX: Implement {platform} data fetcher"
git push origin feature/SAP-XX-{platform}-data-fetcher
```

## Pull Request Template
```markdown
SAP-XX: Implement {Platform} Data Fetcher Lambda Function

This PR implements the {Platform} data fetching functionality, mirroring the structure of our existing implementations.

Key Changes:
- Created Lambda function for {Platform} data fetching
- Implemented mock data generation for development/testing
- Added DynamoDB table template for raw data storage
- Set up error handling and logging
- Added test events for local testing

Technical Details:
- Lambda uses Node.js 18.x runtime
- Implements proper error handling and CORS headers
- Stores data in streaming-analytics-dev-raw-streaming-data DynamoDB table
- Supports both mock and live data modes

Testing:
- Deployed and tested Lambda function
- Verified successful DynamoDB integration
- Confirmed 200 status code responses
- Mock data generation working as expected

Related:
- Jira: SAP-XX
```

## Notes
- Replace `{platform}` with the actual platform name (e.g., youtube, soundcloud)
- Update API endpoints and authentication methods based on platform requirements
- Modify mock data structure to match platform-specific data format
- Update environment variables based on platform authentication requirements

## Common Issues and Solutions
1. **DynamoDB Table Already Exists**: Use update-stack instead of create-stack
2. **Lambda Deployment Fails**: Check zip file contents and ensure all dependencies are included
3. **Git Path Issues**: Always verify current directory before git commands
4. **Base64 Encoding Issues**: Use --cli-binary-format flag with Lambda invocation