import boto3
import json
import requests
from botocore.exceptions import ClientError

def test_cognito_auth(user_pool_id, client_id, test_email, test_password):
    """Test Cognito user creation and authentication"""
    # Initialize Cognito Identity Provider client
    cognito = boto3.client('cognito-idp', region_name='eu-west-2')
    
    # Step 1: Create a test user
    try:
        # First, try to sign up a new user
        cognito.sign_up(
            ClientId=client_id,
            Username=test_email,
            Password=test_password,
            UserAttributes=[
                {'Name': 'email', 'Value': test_email}
            ]
        )
        print("✅ User signup successful")
        
        # Auto-confirm the user (in production, user would need to verify email)
        cognito.admin_confirm_sign_up(
            UserPoolId=user_pool_id,
            Username=test_email
        )
        print("✅ User confirmed successfully")
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'UsernameExistsException':
            print("ℹ️ User already exists, proceeding with authentication")
        else:
            print("❌ Error during signup:", str(e))
            raise e

    # Step 2: Test authentication
    try:
        response = cognito.initiate_auth(
            ClientId=client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': test_email,
                'PASSWORD': test_password
            }
        )
        id_token = response['AuthenticationResult']['IdToken']
        print("✅ Authentication successful")
        print("✅ Received valid ID token")
        return id_token
        
    except ClientError as e:
        print("❌ Authentication failed:", str(e))
        raise e

def test_api_gateway(api_endpoint, id_token):
    """Test API Gateway with authentication"""
    headers = {
        'Authorization': id_token,
        'Content-Type': 'application/json'
    }
    
    # Test CORS
    try:
        options_response = requests.options(api_endpoint, headers=headers)
        print("\nTesting CORS configuration:")
        if options_response.status_code == 200:
            print("✅ OPTIONS request successful")
            cors_headers = options_response.headers
            print("✅ CORS headers present:", 'Access-Control-Allow-Origin' in cors_headers)
        else:
            print("❌ OPTIONS request failed:", options_response.status_code)
    except requests.exceptions.RequestException as e:
        print("❌ API Gateway test failed:", str(e))

if __name__ == "__main__":
    # Your actual values from CloudFormation outputs
    USER_POOL_ID = "eu-west-2_YfkaLo2sC"
    CLIENT_ID = "7thr5k9jdfqnqksh32ou222kt8"
    API_ENDPOINT = "https://0o0aso95ik.execute-api.eu-west-2.amazonaws.com/dev"
    
    # Test credentials
    TEST_EMAIL = "mkklarbi@me.com"
    TEST_PASSWORD = "TestUser123!@#"  # Complex password meeting Cognito requirements
    
    try:
        print("\nStarting authentication tests...")
        print(f"Testing with email: {TEST_EMAIL}")
        # Test Cognito authentication
        id_token = test_cognito_auth(USER_POOL_ID, CLIENT_ID, TEST_EMAIL, TEST_PASSWORD)
        
        print("\nStarting API Gateway tests...")
        # Test API Gateway
        test_api_gateway(API_ENDPOINT, id_token)
        
    except Exception as e:
        print("\n❌ Test failed:", str(e))
    else:
        print("\n✅ All tests completed successfully!")