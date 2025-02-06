import React, { useEffect, useState, useCallback } from 'react';
import { encryptToken, decryptToken, isStorageAvailable, clearAuthData } from './authUtils.js';

const SpotifyAuth = () => {
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = 'http://localhost:5174/spotify-auth';
  const API_ENDPOINT = 'https://0o0aso95ik.execute-api.eu-west-2.amazonaws.com/dev/spotify/callback';

  const storageAvailable = isStorageAvailable('localStorage') && isStorageAvailable('sessionStorage');

  const refreshAccessToken = useCallback(async (refreshToken) => {
    try {
      const REFRESH_ENDPOINT = import.meta.env.VITE_REFRESH_ENDPOINT;
      
      const response = await fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
  
      if (!response.ok) throw new Error('Token refresh failed');
  
      const data = await response.json();
      if (!data.access_token) throw new Error('No access token in refresh response');
  
      setRefreshStatus('Token refreshed successfully');
      setTimeout(() => setRefreshStatus(null), 3000);
  
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      setRefreshStatus('Token refresh failed');
      throw error;
    }
  }, []);

  const processAuthCode = useCallback(async (code, state, attempt = 1) => {
    if (!storageAvailable) {
      setAuthError('Browser storage is not available. Please enable cookies.');
      return;
    }

    try {
      // Prevent parallel processing
      if (sessionStorage.getItem('spotify_processing') === 'true') {
        console.log('Auth code processing already in progress');
        return;
      }
      sessionStorage.setItem('spotify_processing', 'true');

      // Verify state parameter
      const storedState = sessionStorage.getItem('spotify_auth_state');
      if (state !== storedState) {
        throw new Error('State mismatch - security check failed');
      }

      setIsLoading(true);

      const response = await fetch(`${API_ENDPOINT}?code=${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token exchange failed');
      }

      if (data.access_token) {
        const tokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in * 1000),
          token_type: data.token_type,
          scope: data.scope
        };

        // Encrypt before storing
        localStorage.setItem('spotify_auth', encryptToken(tokenData));
        sessionStorage.setItem('spotify_auth_code', code);
        setAuthSuccess(true);
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error) {
      console.error(`Auth error (attempt ${attempt}):`, error);
      
      // Retry on network errors
      if (attempt < MAX_RETRIES && error.name === 'TypeError') {
        setRetryCount(attempt);
        setTimeout(() => processAuthCode(code, state, attempt + 1), 1000 * attempt);
        return;
      }

      setAuthError(error.message);
      clearAuthData();
    } finally {
      setIsLoading(false);
      sessionStorage.removeItem('spotify_processing');
    }
  }, [API_ENDPOINT, storageAvailable]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!storageAvailable) return;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setAuthError(`Spotify error: ${error}`);
        clearAuthData();
        return;
      }

      if (code && state) {
        await processAuthCode(code, state);
        return;
      }

      // Check existing auth
      const encryptedAuth = localStorage.getItem('spotify_auth');
      if (encryptedAuth) {
        try {
          const auth = decryptToken(encryptedAuth);
          if (!auth) throw new Error('Invalid stored auth data');

          if (Date.now() >= auth.expires_at - 60000) { // Refresh if within 1 minute of expiry
            if (auth.refresh_token) {
              const newTokens = await refreshAccessToken(auth.refresh_token);
              const updatedAuth = {
                ...auth,
                access_token: newTokens.access_token,
                expires_at: Date.now() + (newTokens.expires_in * 1000)
              };
              localStorage.setItem('spotify_auth', encryptToken(updatedAuth));
            } else {
              throw new Error('No refresh token available');
            }
          }
          setAuthSuccess(true);
        } catch (error) {
          console.error('Auth validation error:', error);
          clearAuthData();
        }
      }
    };

    checkAuth();
  }, [processAuthCode, refreshAccessToken, storageAvailable]);

  const handleLogin = () => {
    if (!storageAvailable) {
      setAuthError('Browser storage is not available. Please enable cookies.');
      return;
    }

    clearAuthData();

    // Generate state parameter using Web Crypto API
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    sessionStorage.setItem('spotify_auth_state', state);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    Object.entries({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      state: state,
      scope: [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative'
      ].join(' '),
      show_dialog: 'true'
    }).forEach(([key, value]) => authUrl.searchParams.append(key, value));

    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthSuccess(false);
    setAuthError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-4">
            Connecting to Spotify...
          </h2>
          {retryCount > 0 && (
            <p className="text-yellow-600 text-center">
              Retrying... Attempt {retryCount} of {MAX_RETRIES}
            </p>
          )}
        </div>
      </div>
    );
  }
  const forceTokenExpiration = async () => {
  try {
    const auth = localStorage.getItem('spotify_auth');
    if (auth) {
      const decoded = decryptToken(auth);
      decoded.expires_at = Date.now() - 1000; // Set expiration to 1 second ago
      localStorage.setItem('spotify_auth', encryptToken(decoded));
      console.log('Token expiration forced');
      setRefreshStatus('Token expiration forced - attempting refresh...');
      
      // Actively trigger the refresh
      if (decoded.refresh_token) {
        try {
          const newTokens = await refreshAccessToken(decoded.refresh_token);
          const updatedAuth = {
            ...decoded,
            access_token: newTokens.access_token,
            expires_at: Date.now() + (newTokens.expires_in * 1000)
          };
          localStorage.setItem('spotify_auth', encryptToken(updatedAuth));
          setRefreshStatus('Token refreshed successfully');
          setTimeout(() => setRefreshStatus(null), 3000);
        } catch (error) {
          console.error('Refresh failed:', error);
          setRefreshStatus('Token refresh failed');
        }
      }
    }
  } catch (error) {
    console.error('Error forcing expiration:', error);
    setRefreshStatus('Error during token refresh process');
  }
};

  if (authSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-green-600 mb-4">
            Successfully Connected!
          </h2>
          
          {refreshStatus && (
            <div className="my-4 p-4 bg-blue-100 text-blue-700 rounded">
              {refreshStatus}
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={forceTokenExpiration}
              className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2"
            >
              Test Token Refresh
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">
          Connect to Spotify
        </h2>
        
        {!storageAvailable && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            Warning: Browser storage is not available. Please enable cookies.
          </div>
        )}
        
        {authError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {authError}
          </div>
        )}
        
        <button
          onClick={handleLogin}
          disabled={!storageAvailable}
          className={`w-full px-6 py-3 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            storageAvailable 
              ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
};

export default SpotifyAuth;

// Content from the spotify-oauth-simplified artifact above
