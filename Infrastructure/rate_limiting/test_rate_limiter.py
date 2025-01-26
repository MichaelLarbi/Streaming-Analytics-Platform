import unittest
from rate_limiter import rate_limit

@rate_limit(calls_per_second=2)
def test_lambda_function(event, context):
    return {
        'statusCode': 200,
        'body': 'Success'
    }

class TestRateLimiter(unittest.TestCase):
    def test_rate_limiting(self):
        event = {'headers': {'x-api-key': 'test-key'}}
        context = {}

        # First call should succeed
        response1 = test_lambda_function(event, context)
        self.assertEqual(response1['statusCode'], 200)

        # Second call should succeed
        response2 = test_lambda_function(event, context)
        self.assertEqual(response2['statusCode'], 200)

        # Third call should be rate limited
        response3 = test_lambda_function(event, context)
        self.assertEqual(response3['statusCode'], 429)

if __name__ == '__main__':
    unittest.main()
    