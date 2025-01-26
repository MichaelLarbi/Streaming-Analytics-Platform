import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SpotifyAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  // These would come from your AWS environment variables
  const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
  
  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-top-read',
    'user-read-recently-played'
  ];

  useEffect(() => {
    // Check if we're handling the OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (code) {
      handleSpotifyCallback(code);
    } else if (error) {
      setError('Failed to authenticate with Spotify');
    }
  }, []);

  const handleSpotifyCallback = async (code) => {
    try {
      const response = await fetch('/api/spotify/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      if (data.access_token) {
        setIsAuthenticated(true);
        localStorage.setItem('spotify_access_token', data.access_token);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
    window.location.href = authUrl;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Spotify Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isAuthenticated ? (
          <div className="text-center text-green-600">
            Successfully authenticated with Spotify!
          </div>
        ) : (
          <Button 
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Connect Spotify Account
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SpotifyAuth;
