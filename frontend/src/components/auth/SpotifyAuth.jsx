import React, { useEffect, useState } from 'react';

const SpotifyAuth = () => {
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  // Development redirect URI - must match exactly what's in Spotify Dashboard
  const REDIRECT_URI = 'http://localhost:5174/spotify-auth';
  const CLIENT_ID = '8cf77f03d31348b4953b2d65d96f1af1';
  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative'
  ];

  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        console.error('Spotify auth error:', error);
        setAuthError(`Authentication failed: ${error}`);
        return;
      }
      
      if (code) {
        try {
          setIsLoading(true);
          console.log('Received auth code:', code);
          
          const response = await fetch('https://0o0aso95ik.execute-api.eu-west-2.amazonaws.com/dev/spotify/callback', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'omit'
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Response not OK:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Successfully authenticated with Spotify');
          
          // Store the authentication result
          localStorage.setItem('spotifyAuth', JSON.stringify(data));
          setAuthSuccess(true);
          
          // Redirect to home page after 2 seconds
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          
        } catch (error) {
          console.error('Error during callback:', error);
          setAuthError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleAuthCallback();
  }, []);

  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
    
    console.log('Redirecting to Spotify auth URL:', authUrl);
    window.location.href = authUrl;
  };

  if (authSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-center text-green-600">
            Successfully connected to Spotify!
          </h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
            Connecting to Spotify...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Connect to Spotify
        </h2>
        
        {authError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {authError}
          </div>
        )}
        
        <button
          onClick={handleLogin}
          className="px-6 py-3 font-semibold text-white bg-green-500 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
};

export default SpotifyAuth;