import React, { useEffect, useState } from 'react';

const SpotifyAuth = () => {
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Constants from environment variables
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
    const processCode = async (code) => {
      // Check if we've already processed this code
      const processedCode = sessionStorage.getItem('processed_auth_code');
      if (processedCode === code) {
        console.log('Auth code already processed, skipping');
        return;
      }

      try {
        setIsLoading(true);
        setDebugInfo(prevInfo => ({
          ...prevInfo,
          stage: 'processing_code'
        }));

        const apiUrl = `${API_ENDPOINT}/spotify/callback?code=${encodeURIComponent(code)}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to exchange code');
        }

        if (data.access_token) {
          // Mark this code as processed
          sessionStorage.setItem('processed_auth_code', code);
          
          // Store the tokens
          const tokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Date.now() + (data.expires_in * 1000),
            token_type: data.token_type,
            scope: data.scope
          };
          
          localStorage.setItem('spotifyAuth', JSON.stringify(tokenData));
          setAuthSuccess(true);
          
          setDebugInfo(prevInfo => ({
            ...prevInfo,
            stage: 'success',
            tokenInfo: {
              expiresAt: new Date(tokenData.expires_at).toISOString(),
              tokenType: tokenData.token_type,
              scope: tokenData.scope
            }
          }));
        }
      } catch (error) {
        console.error('Error during code exchange:', error);
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

    const checkAuthStatus = async () => {
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const spotifyCode = urlParams.get('code');
      const spotifyError = urlParams.get('error');
      const receivedState = urlParams.get('state');
      const storedState = sessionStorage.getItem('spotify_auth_state');

      setDebugInfo({
        stage: 'initial_check',
        params: {
          hasCode: Boolean(spotifyCode),
          error: spotifyError,
          stateValid: receivedState === storedState
        }
      });

      if (spotifyError) {
        setAuthError(`Authentication failed: ${spotifyError}`);
        return;
      }

      // Validate state if present
      if (receivedState && receivedState !== storedState) {
        setAuthError('Invalid state parameter. Please try again.');
        return;
      }

      if (spotifyCode) {
        await processCode(spotifyCode);
      } else {
        // Check for existing valid auth
        const storedAuth = localStorage.getItem('spotifyAuth');
        if (storedAuth) {
          try {
            const authData = JSON.parse(storedAuth);
            if (authData.expires_at > Date.now()) {
              setAuthSuccess(true);
              setDebugInfo(prevInfo => ({
                ...prevInfo,
                stage: 'using_stored_auth',
                tokenInfo: {
                  expiresAt: new Date(authData.expires_at).toISOString(),
                  tokenType: authData.token_type,
                  scope: authData.scope
                }
              }));
            }
          } catch (error) {
            console.error('Error parsing stored auth:', error);
            localStorage.removeItem('spotifyAuth');
          }
        }
      }
    };

    checkAuthStatus();
  }, [API_ENDPOINT]);

  const handleLogin = () => {
    // Generate state parameter
    const state = crypto.getRandomValues(new Uint8Array(16))
      .reduce((acc, x) => acc + x.toString(16).padStart(2, '0'), '');
    sessionStorage.setItem('spotify_auth_state', state);
    
    // Clear any existing auth
    localStorage.removeItem('spotifyAuth');
    sessionStorage.removeItem('processed_auth_code');
    
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('state', state);
    
    setDebugInfo({
      stage: 'initiating_login',
      timestamp: new Date().toISOString()
    });

    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem('spotifyAuth');
    sessionStorage.removeItem('processed_auth_code');
    sessionStorage.removeItem('spotify_auth_state');
    setAuthSuccess(false);
    setDebugInfo({
      stage: 'logged_out',
      timestamp: new Date().toISOString()
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
            Connecting to Spotify...
          </h2>
          <div className="text-center text-gray-600">Please wait while we process your authentication</div>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
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
          <div className="mb-4 text-center text-gray-600">
            Your Spotify account is now connected to the Streaming Analytics Platform
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="px-6 py-3 font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Disconnect
            </button>
          </div>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
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
        
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyAuth;
