import unittest
import json
from src.functions.spotify.validate_credentials import validate_spotify_credentials

class TestSpotifyValidation(unittest.TestCase):
    def test_valid_credentials(self):
        event = {
            'body': json.dumps({
                'client_id': 'valid_id',
                'client_secret': 'valid_secret'
            })
        }
        response = validate_spotify_credentials(event, None)
        self.assertEqual(response['statusCode'], 200)

    def test_missing_client_id(self):
        event = {
            'body': json.dumps({
                'client_secret': 'valid_secret'
            })
        }
        response = validate_spotify_credentials(event, None)
        self.assertEqual(response['statusCode'], 400)

    def test_invalid_credentials(self):
        event = {
            'body': json.dumps({
                'client_id': 'invalid',
                'client_secret': 'valid_secret'
            })
        }
        response = validate_spotify_credentials(event, None)
        self.assertEqual(response['statusCode'], 401)

if __name__ == '__main__':
    unittest.main()