import boto3
import json
import requests
from botocore.exceptions import ClientError

def test_cognito_auth(user_pool_id, client_id, test_email, test_password):
    """Test Cognito user creation and authentication"""
    cognito = boto3.client('cognito-idp', region_name='eu-west-2')
    
    try:
        # Try to sign up a new user
        cognito.sign_up(
            ClientId=client_id,
            Username=test_email,
            Password=test_password,
            UserAttributes=[
                {'Name': 'email', 'Value': test_email}
            ]
        )
        print("✅ User signup successful")
        
        cognito.admin_confirm_sign_up(
            UserPoolId=user_pool_id,
            Username=test_email
        )
        print("✅ User confirmed successfully")
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'UsernameExistsException':
            print("ℹ️ User already exists, proceeding with authentication")
        else:
            raise e

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
        return id_token
        
    except ClientError as e:
        print("❌ Authentication failed:", str(e))
        raise e

def test_endpoints(base_url, id_token):
    """Test all API endpoints"""
    headers = {
        'Authorization': id_token,
        'Content-Type': 'application/json'
    }
    
    endpoints = [
        '/analytics',
        '/playlists',
        '/user'
    ]
    
    for endpoint in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            print(f"\nTesting endpoint: {url}")
            
            # Test OPTIONS (CORS)
            options_response = requests.options(url, headers=headers)
            print(f"OPTIONS: {options_response.status_code}")
            
            # Test GET
            get_response = requests.get(url, headers=headers)
            print(f"GET: {get_response.status_code}")
            if get_response.status_code == 200:
                print("Response:", get_response.json())
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error testing {endpoint}:", str(e))

if __name__ == "__main__":
    # Your actual values from CloudFormation outputs
    USER_POOL_ID = "eu-west-2_YfkaLo2sC"
    CLIENT_ID = "7thr5k9jdfqnqksh32ou222kt8"
    API_ENDPOINT = "https://0o0aso95ik.execute-api.eu-west-2.amazonaws.com/dev"
    
    TEST_EMAIL = "mkklarbi@me.com"
    TEST_PASSWORD = "TestUser123!@#"
    
    try:
        print("\nStarting authentication tests...")
        id_token = test_cognito_auth(USER_POOL_ID, CLIENT_ID, TEST_EMAIL, TEST_PASSWORD)
        
        print("\nStarting endpoint tests...")
        test_endpoints(API_ENDPOINT, id_token)
        
    except Exception as e:
        print("\n❌ Test failed:", str(e))
    else:
        print("\n✅ All tests completed successfully!")