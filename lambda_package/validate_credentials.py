import json
import os
from common.error_handling.handler import lambda_handler_wrapper
from common.error_handling.exceptions import ValidationError, AuthenticationError

@lambda_handler_wrapper
def validate_spotify_credentials(event, context):
    body = json.loads(event.get('body', '{}'))
    
    # Validate required fields
    if not body.get('client_id'):
        raise ValidationError('client_id is required')
    if not body.get('client_secret'):
        raise ValidationError('client_secret is required')
        
    # Mock authentication check
    if body['client_id'] == 'invalid':
        raise AuthenticationError('Invalid Spotify credentials')
        
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Credentials validated successfully',
            'valid': True
        })
    }
