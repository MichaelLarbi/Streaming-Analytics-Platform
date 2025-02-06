# Streaming Platform Data Validation Implementation Guide

## Overview
This document provides step-by-step instructions for implementing data validation for different streaming platforms (Apple Music, YouTube, etc.) following the pattern established with Spotify.

## Prerequisites
- AWS CLI configured (default region: eu-west-2)
- Git repository access
- Jira access
- Project structure in place

## Implementation Steps

### 1. Jira Setup
Create a new ticket with:
- Title: "Implement Data Validation for [Platform] Integration"
- Description: "Add validation layer to ensure data quality and consistency from [Platform] API responses"
- Type: Task
- Priority: P2
- Component: Backend
- Story Points: 5

### 2. Git Setup
```bash
cd /Users/michaellarbi/Streaming-Analytics-Platform/Streaming-Analytics-Platform
git checkout -b feature/SAP-XX-[platform]-data-validation
```

### 3. File Structure Template
```
Infrastructure/
└── CloudFormation/
    └── lambda/
        └── [platform]-data-validator/
            ├── validation.js
            ├── index.js
            └── template.yaml
```

### 4. Code Templates

#### validation.js Template
```javascript
const validate[Platform]Response = (data, type) => {
  switch (type) {
    case '[type1]':
      return validate[Type1]Data(data);
    case '[type2]':
      return validate[Type2]Data(data);
    default:
      throw new Error(`Unknown data type: ${type}`);
  }
};

const validate[Type1]Data = (data) => {
  const requiredFields = ['id', 'name', /* platform-specific fields */];
  const errors = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Platform-specific validations
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitize[Type1]Data(data) : null
  };
};

const sanitize[Type1]Data = (data) => ({
  id: data.id,
  name: data.name,
  // Platform-specific sanitization
});

module.exports = {
  validate[Platform]Response
};
```

#### index.js Template
```javascript
const { validate[Platform]Response } = require('./validation');

exports.handler = async (event) => {
  try {
    const { body, dataType } = JSON.parse(event.body);
    
    const validationResult = validate[Platform]Response(body, dataType);
    
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
        error: error.message
      })
    };
  }
};
```

#### CloudFormation Template (template.yaml)
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: '[Platform] Data Validator Lambda Function'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
    Description: 'Environment name'

Resources:
  [Platform]ValidatorFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '[platform]-data-validator-${Environment}'
      Handler: index.handler
      Role: !GetAtt [Platform]ValidatorRole.Arn
      Code:
        S3Bucket: !Sub 'streaming-analytics-${Environment}'
        S3Key: lambda/[platform]-data-validator.zip
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 128
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment

  [Platform]ValidatorRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '[platform]-validator-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  [Platform]ValidatorLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/lambda/[platform]-data-validator-${Environment}'
      RetentionInDays: 14

Outputs:
  [Platform]ValidatorFunctionArn:
    Description: '[Platform] Validator Lambda Function ARN'
    Value: !GetAtt [Platform]ValidatorFunction.Arn
```

### 5. Deployment Commands
```bash
# Create directories
mkdir -p Infrastructure/CloudFormation/lambda/[platform]-data-validator

# Create deployment package
cd Infrastructure/CloudFormation/lambda/[platform]-data-validator
zip -r [platform]-data-validator.zip index.js validation.js

# Upload to S3
aws s3 cp [platform]-data-validator.zip s3://streaming-analytics-dev/lambda/

# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name [platform]-data-validator-dev \
  --template-body file://template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

### 6. Testing Template
```bash
# Create test files
cat > test-valid-[type].json << 'EOL'
{
  "body": "{\"dataType\": \"[type]\", \"body\": {\"id\": \"1234\", \"name\": \"Test [Type]\", /* platform-specific fields */}}"
}
EOL

# Test validation
aws lambda invoke \
  --function-name [platform]-data-validator-dev \
  --payload file://test-valid-[type].json \
  --cli-binary-format raw-in-base64-out \
  response-valid-[type].json
```

### 7. Pull Request Template
```markdown
# Implementation of [Platform] Data Validation Layer (SAP-XX)

## Changes Made
- Created validation schema for [Platform] API responses
- Implemented dedicated Lambda function for data validation
- Added CloudFormation template for infrastructure as code
- Implemented validation for [list of types]

## Key Features
- Validates required fields for each data type
- Type checking for numerical values
- Range validation for specific fields
- Data sanitization for verified responses
- Comprehensive error messaging

## Testing Done
- Tested valid [type] data (200 status response)
- Tested invalid [type] data (400 status response)
- Verified error message clarity
- Confirmed proper rejection of malformed data

## Related Tickets
- Jira: SAP-XX

## Deployment Notes
- Deployed to development environment
- Lambda function name: [platform]-data-validator-dev
- S3 bucket: streaming-analytics-dev
- Region: eu-west-2 (London)
```

## Platform-Specific Considerations

### Apple Music
- Focus on validating catalog IDs
- Include storefront validation
- Handle relationships data structure

### YouTube
- Validate video IDs format
- Include contentDetails validation
- Handle statistics data types

## Common Gotchas
1. Remember to update CORS headers for each platform
2. Ensure proper error handling for platform-specific error codes
3. Consider rate limiting requirements
4. Handle platform-specific date formats
5. Account for regional variations in data

## Verification Checklist
- [ ] All required fields are being validated
- [ ] Numerical fields have type checking
- [ ] Date fields are properly formatted
- [ ] Error messages are clear and helpful
- [ ] Sanitized data matches platform requirements
- [ ] CORS headers are properly set
- [ ] CloudFormation stack deploys successfully
- [ ] Lambda function executes without errors
- [ ] Test cases cover main scenarios
