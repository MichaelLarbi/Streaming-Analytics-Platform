import React, { useEffect, useState } from 'react';

const SpotifyAuth = () => {
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Constants for Spotify OAuth
  const CLIENT_ID = '8cf77f03d31348b4953b2d65d96f1af1';
  const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
  const REDIRECT_URI = 'http://localhost:5174/spotify-auth';
  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative'
  ];

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check if we're receiving a callback from Spotify
      const urlParams = new URLSearchParams(window.location.search);
      const spotifyCode = urlParams.get('code');
      const spotifyError = urlParams.get('error');

      console.log('URL Parameters:', {
        code: spotifyCode,
        error: spotifyError,
        fullUrl: window.location.href
      });

      if (spotifyError) {
        console.error('Spotify authentication error:', spotifyError);
        setAuthError('Failed to authenticate with Spotify');
        setDebugInfo({ type: 'error', details: spotifyError });
        return;
      }

      if (spotifyCode) {
        await handleSpotifyCallback(spotifyCode);
      }

      // Check if we're already authenticated
      const storedAuth = localStorage.getItem('spotifyAuth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          if (authData.access_token) {
            setAuthSuccess(true);
            setDebugInfo({ type: 'stored_auth', details: authData });
          }
        } catch (error) {
          console.error('Error parsing stored auth:', error);
          localStorage.removeItem('spotifyAuth');
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleSpotifyCallback = async (spotifyCode) => {
    try {
      setIsLoading(true);
      console.log('Processing Spotify code:', spotifyCode);

      const apiUrl = `https://0o0aso95ik.execute-api.eu-west-2.amazonaws.com/dev/spotify/callback?code=${encodeURIComponent(spotifyCode)}`;
      console.log('Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      if (!response.ok) {
        throw new Error(`API call failed: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed API Response:', data);
      
      // Store the token
      localStorage.setItem('spotifyAuth', JSON.stringify(data));
      setAuthSuccess(true);
      setDebugInfo({ type: 'success', details: data });

    } catch (error) {
      console.error('Error during Spotify callback:', error);
      setAuthError(error.message);
      setDebugInfo({ type: 'callback_error', details: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // Construct Spotify authorization URL
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('show_dialog', 'true');

    console.log('Redirecting to Spotify auth URL:', authUrl.toString());
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem('spotifyAuth');
    setAuthSuccess(false);
    setDebugInfo(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
            Connecting to Spotify...
          </h2>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (authSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-center text-green-600">
            Successfully connected to Spotify!
          </h2>
          <button
            onClick={handleLogout}
            className="px-6 py-3 font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Disconnect
          </button>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
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

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyAuth;