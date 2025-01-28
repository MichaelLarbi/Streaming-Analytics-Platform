import React, { useEffect, useState } from 'react';

const SpotifyAuth = () => {
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Move these to environment variables
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;
  
  const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative'
  ];

  useEffect(() => {
    // Generate and store state parameter for CSRF protection
    const generateStateParam = () => {
      const state = crypto.getRandomValues(new Uint8Array(16))
        .reduce((acc, x) => acc + x.toString(16).padStart(2, '0'), '');
      sessionStorage.setItem('spotify_auth_state', state);
      return state;
    };

    // Clear any existing auth on component mount
    localStorage.removeItem('spotifyAuth');
    
    const checkAuthStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const spotifyCode = urlParams.get('code');
      const spotifyError = urlParams.get('error');
      const receivedState = urlParams.get('state');
      const storedState = sessionStorage.getItem('spotify_auth_state');

      setDebugInfo({
        stage: 'initial_check',
        params: {
          code: spotifyCode ? 'present' : 'absent', // Don't log the actual code
          error: spotifyError,
          stateValid: receivedState === storedState
        }
      });

      if (spotifyError) {
        console.error('Spotify authentication error:', spotifyError);
        setAuthError('Failed to authenticate with Spotify');
        return;
      }

      // Validate state parameter
      if (receivedState !== storedState) {
        setAuthError('Invalid state parameter. Please try again.');
        return;
      }

      if (spotifyCode) {
        await handleSpotifyCallback(spotifyCode);
      }
    };

    checkAuthStatus();
  }, []);

  const handleSpotifyCallback = async (spotifyCode) => {
    try {
      setIsLoading(true);
      setDebugInfo(prevInfo => ({
        ...prevInfo,
        stage: 'callback_started'
      }));

      const apiUrl = `${API_ENDPOINT}/spotify/callback?code=${encodeURIComponent(spotifyCode)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit' // Don't send cookies
      });

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
        
        setDebugInfo(prevInfo => ({
          ...prevInfo,
          stage: 'api_response',
          status: response.status,
          error: data.error
        }));
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to exchange authorization code');
      }
      
      if (data.access_token) {
        // Store tokens securely
        const tokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in * 1000),
          token_type: data.token_type
        };
        
        localStorage.setItem('spotifyAuth', JSON.stringify(tokenData));
        setAuthSuccess(true);
        setDebugInfo(prevInfo => ({
          ...prevInfo,
          stage: 'success',
          tokenInfo: {
            expiresAt: new Date(tokenData.expires_at).toISOString(),
            tokenType: tokenData.token_type
          }
        }));
      } else {
        throw new Error('No access token in response');
      }

    } catch (error) {
      console.error('Error during Spotify callback:', error);
      setAuthError(error.message);
      setDebugInfo(prevInfo => ({
        ...prevInfo,
        stage: 'error',
        error: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // Clear any existing auth before starting new flow
    localStorage.removeItem('spotifyAuth');
    
    const state = crypto.getRandomValues(new Uint8Array(16))
      .reduce((acc, x) => acc + x.toString(16).padStart(2, '0'), '');
    sessionStorage.setItem('spotify_auth_state', state);
    
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('show_dialog', 'true');
    authUrl.searchParams.append('state', state);
    
    setDebugInfo({
      stage: 'initiating_login',
      timestamp: new Date().toISOString()
    });

    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem('spotifyAuth');
    setAuthSuccess(false);
    setDebugInfo({
      stage: 'logged_out',
      timestamp: new Date().toISOString()
    });
  };

  const debugPanel = (
    <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
      <h3 className="font-bold mb-2">Debug Information</h3>
      <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
            Connecting to Spotify...
          </h2>
          {debugPanel}
        </div>
      </div>
    );
  }

  if (authSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="mb-6 text-2xl font-bold text-center text-green-600">
            Successfully connected to Spotify!
          </h2>
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="px-6 py-3 font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Disconnect
            </button>
          </div>
          {debugPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-2xl w-full">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Connect to Spotify
        </h2>
        
        {authError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {authError}
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            className="px-6 py-3 font-semibold text-white bg-green-500 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Login with Spotify
          </button>
        </div>
        
        {debugPanel}
      </div>
    </div>
  );
};

export default SpotifyAuth;