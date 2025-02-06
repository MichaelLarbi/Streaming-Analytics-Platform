# Streaming Analytics Platform - Scheduled Data Collection Implementation Guide

## Overview
This document provides step-by-step instructions for implementing scheduled data collection for streaming platforms using AWS EventBridge and CloudFormation.

## Prerequisites
- AWS CLI installed and configured
- Access to GitHub repository
- Jira access
- Existing data fetcher Lambda function for the platform

## Implementation Steps

### 1. Git Setup
```bash
# Navigate to project directory
cd /Users/michaellarbi/Streaming-Analytics-Platform/Streaming-Analytics-Platform

# Create feature branch (replace XX with Jira ticket number and PLATFORM with platform name)
git checkout -b feature/SAP-XX-PLATFORM-scheduled-collection
```

### 2. Directory Creation
```bash
# Create directory for new platform
mkdir -p Infrastructure/CloudFormation/scheduled-collection/PLATFORM
```

### 3. CloudFormation Template
Create file: `Infrastructure/CloudFormation/scheduled-collection/PLATFORM/scheduled-collection.yaml`

Template content:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Scheduled Data Collection for PLATFORM Analytics'

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
    Description: 'Base name for project resources'

  ScheduleExpression:
    Type: String
    Default: 'rate(1 hour)'
    Description: 'Schedule expression for data collection'

Resources:
  # EventBridge Rule
  PlatformDataCollectionRule:
    Type: 'AWS::Events::Rule'
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-PLATFORM-collection'
      Description: 'Trigger PLATFORM data collection on schedule'
      ScheduleExpression: !Ref ScheduleExpression
      State: 'ENABLED'
      Targets:
        - Arn: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:streaming-analytics-dev-PLATFORM-data-fetcher'
          Id: 'PlatformDataFetcher'

  # Lambda Permission for EventBridge
  LambdaPermission:
    Type: 'AWS::Lambda::Permission'
    Properties:
      Action: 'lambda:InvokeFunction'
      FunctionName: 'streaming-analytics-dev-PLATFORM-data-fetcher'
      Principal: 'events.amazonaws.com'
      SourceArn: !GetAtt PlatformDataCollectionRule.Arn

Outputs:
  EventRuleArn:
    Description: 'EventBridge Rule ARN'
    Value: !GetAtt PlatformDataCollectionRule.Arn
```

### 4. Stack Deployment
```bash
# Deploy CloudFormation stack (replace PLATFORM with platform name)
aws cloudformation create-stack \
  --stack-name streaming-analytics-PLATFORM-collection-dev \
  --template-body file://Infrastructure/CloudFormation/scheduled-collection/PLATFORM/scheduled-collection.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
               ParameterKey=ProjectName,ParameterValue=streaming-analytics \
               ParameterKey=ScheduleExpression,ParameterValue="rate(1 hour)"
```

### 5. Git Commands
```bash
# Add and commit changes
git add Infrastructure/CloudFormation/scheduled-collection/PLATFORM/scheduled-collection.yaml
git commit -m "SAP-XX: Add CloudFormation template for scheduled PLATFORM data collection"
git push origin feature/SAP-XX-PLATFORM-scheduled-collection
```

### 6. Pull Request Template
```markdown
Title: SAP-XX: Implement Scheduled PLATFORM Data Collection

Description:
# Overview
Implements automated hourly data collection from PLATFORM using AWS EventBridge to trigger the existing PLATFORM-data-fetcher Lambda function.

## Changes Made
- Created new CloudFormation template for EventBridge scheduling
- Configured hourly trigger for PLATFORM data collection
- Added necessary Lambda permissions for EventBridge invocation

## Infrastructure Added
- EventBridge Rule: streaming-analytics-dev-PLATFORM-collection
- Lambda Permission: Allows EventBridge to invoke the data fetcher

## Testing Done
- Successfully deployed CloudFormation stack
- Verified EventBridge rule creation
- Confirmed Lambda permissions are correctly set

## Related Tickets
- Jira: SAP-XX

## Security Considerations
- Limited Lambda invocation permissions to specific EventBridge rule
- Maintained existing security configurations

## Notes for Reviewers
- CloudFormation template follows project standards
- Schedule is configurable via parameters if frequency needs adjustment
```

## Verification Steps
1. Check AWS CloudFormation console for successful stack creation
2. Verify EventBridge rule in AWS Console
3. Monitor CloudWatch Logs for Lambda execution

## Common Issues and Solutions

### Stack Creation Failure
- Verify Lambda function exists with correct name
- Check IAM permissions
- Validate template syntax

### EventBridge Rule Not Triggering
- Verify Lambda function name matches exactly
- Check EventBridge rule is enabled
- Confirm Lambda permissions are correct

## Platform-Specific Considerations

### Apple Music
- Lambda function name should be: streaming-analytics-dev-apple-music-data-fetcher
- Adjust schedule based on API rate limits

### YouTube
- Lambda function name should be: streaming-analytics-dev-youtube-data-fetcher
- Consider quota limitations in scheduling

## Documentation Updates
Remember to update the following documentation:
1. Project README.md
2. Architecture diagrams
3. Monitoring documentation

## Contact
For questions or issues, please contact Michael Larbi (mkklarbi@me.com)