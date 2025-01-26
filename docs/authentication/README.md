# Streaming Analytics Platform - Authentication System Documentation

## Overview
This document details the implementation of the authentication system for the Streaming Analytics Platform, completed under Jira ticket SAP-28.

## System Components

### 1. AWS Cognito User Pool
- **Pool ID:** eu-west-2_YfkaLo2sC
- **Client ID:** 7thr5k9jdfqnqksh32ou222kt8
- **Region:** eu-west-2 (London)
- **Features:**
  - Email-based authentication
  - OAuth2.0 support
  - Secure password policies
  - User account management

### 2. API Gateway
- **Endpoint URL:** https://0o0aso95ik.execute-api.eu-west-2.amazonaws.com/dev
- **Features:**
  - CORS enabled
  - Cognito authorizer integration
  - Development stage deployed

## Repository Structure
```
Streaming-Analytics-Platform/
├── Infrastructure/
│   └── CloudFormation/
│       └── auth/
│           └── api-auth.yaml    # Authentication infrastructure template
└── tests/
    └── authentication/
        └── test_auth.py        # Authentication test script
```

## CloudFormation Stack
- **Stack Name:** streaming-analytics-auth-dev
- **Region:** eu-west-2
- **Template:** Infrastructure/CloudFormation/auth/api-auth.yaml

## Testing
Test script location: `tests/authentication/test_auth.py`
- Tests user creation
- Tests authentication flow
- Verifies API Gateway configuration
- Checks CORS setup

### Test Credentials
- **Test Email:** mkklarbi@me.com
- **Test Password:** TestUser123!@#

## Important URLs
1. AWS Console (London Region):
   - https://eu-west-2.console.aws.amazon.com/
2. Cognito User Pool:
   - https://eu-west-2.console.aws.amazon.com/cognito/v2/idp/user-pools
3. API Gateway:
   - https://eu-west-2.console.aws.amazon.com/apigateway

## GitHub Repository
- **URL:** https://github.com/MichaelLarbi/Streaming-Analytics-Platform.git
- **Feature Branch:** feature/SAP-28-api-authentication

## Implementation Steps Completed
1. Created CloudFormation template for authentication infrastructure
2. Deployed Cognito User Pool and Client
3. Set up API Gateway with Cognito authorizer
4. Implemented CORS configuration
5. Created and verified test script
6. Documented implementation

## Security Features
- Password requirements enforced by Cognito
- CORS configuration for API security
- Token-based authentication
- API Gateway authorization

## Deployment Commands
```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name streaming-analytics-auth-dev \
  --template-body file://Infrastructure/CloudFormation/auth/api-auth.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
              ParameterKey=ProjectName,ParameterValue=streaming-analytics \
  --capabilities CAPABILITY_IAM \
  --region eu-west-2

# Run tests
python3 tests/authentication/test_auth.py
```

## Additional Notes
- All AWS resources are tagged with project and environment information
- The authentication system is configured for development environment
- Production deployment will require additional security measures

## Future Enhancements
- [ ] WAF implementation
- [ ] Custom domain configuration
- [ ] Additional API endpoints
- [ ] Enhanced monitoring and logging

## Troubleshooting
If authentication issues occur:
1. Check AWS CloudWatch logs
2. Verify Cognito User Pool status
3. Confirm API Gateway deployment
4. Review CORS configuration

## Support
For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Contact project maintainers