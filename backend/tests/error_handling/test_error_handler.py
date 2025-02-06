import unittest
import json
from src.common.error_handling.handler import lambda_handler_wrapper
from src.common.error_handling.exceptions import ValidationError, AuthenticationError

class TestErrorHandler(unittest.TestCase):
    def setUp(self):
        @lambda_handler_wrapper
        def sample_handler(event, context):
            if event.get('throw_error') == 'validation':
                raise ValidationError('Invalid data')
            elif event.get('throw_error') == 'auth':
                raise AuthenticationError('Invalid token')
            return {'statusCode': 200, 'body': 'Success'}
        self.handler = sample_handler

    def test_validation_error(self):
        result = self.handler({'throw_error': 'validation'}, None)
        self.assertEqual(result['statusCode'], 400)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Invalid data')

    def test_auth_error(self):
        result = self.handler({'throw_error': 'auth'}, None)
        self.assertEqual(result['statusCode'], 401)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Invalid token')

    def test_success(self):
        result = self.handler({}, None)
        self.assertEqual(result['statusCode'], 200)

    def test_unexpected_error(self):
        @lambda_handler_wrapper
        def failing_handler(event, context):
            raise Exception('Unexpected error')
        
        result = failing_handler({}, None)
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Internal server error')

if __name__ == '__main__':
    unittest.main()