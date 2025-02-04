import React, { useState, useEffect, useCallback } from 'react';
import { encryptToken, decryptToken } from './authUtils';

const AppleMusicAuth = () => {
  console.log('AppleMusicAuth component rendering');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [musicKit, setMusicKit] = useState(null);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Handle MusicKit authorization status changes
  const handleAuthChange = useCallback((event) => {
    console.log('Authorization status changed:', event);
    if (event.authorizationStatus) {
      handleAuthentication();
    } else {
      handleDisconnect();
    }
  }, []);

  // Initialize MusicKit
  useEffect(() => {
    const initializeMusicKit = async () => {
      try {
        setIsLoading(true);
        const music = await window.MusicKit.configure({
          developerToken: import.meta.env.VITE_APPLE_MUSIC_TOKEN,
          app: {
            name: 'Streaming Analytics',
            build: '1.0.0'
          }
        });
        
        setMusicKit(music);
        music.addEventListener('authorizationStatusDidChange', handleAuthChange);
        
        // Check if already authorized
        if (music.isAuthorized) {
          handleAuthentication();
        }
        
        setInitializationComplete(true);
      } catch (err) {
        console.error('Error initializing MusicKit:', err);
        setAuthError('Failed to initialize Apple Music integration');
      } finally {
        setIsLoading(false);
      }
    };

    if (window.MusicKit) {
      initializeMusicKit();
    }

    // Cleanup function
    return () => {
      if (musicKit) {
        musicKit.removeEventListener('authorizationStatusDidChange', handleAuthChange);
      }
    };
  }, [handleAuthChange]);

  // Check existing authentication
  useEffect(() => {
    const checkExistingAuth = () => {
      const encrypted = localStorage.getItem('apple_music_auth');
      if (encrypted) {
        const token = decryptToken(encrypted);
        if (token && token.expiresAt > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('apple_music_auth');
          if (musicKit && musicKit.isAuthorized) {
            handleDisconnect();
          }
        }
      }
    };

    checkExistingAuth();
  }, [musicKit]);

  const handleAuthenticationWithRetry = async (retryCount = 3) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        await handleAuthentication();
        return;
      } catch (error) {
        if (i === retryCount - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const handleAuthentication = async () => {
    console.log('handleAuthentication called');
    if (!initializationComplete) {
      setAuthError('MusicKit initialization not complete');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      if (!musicKit) {
        throw new Error('MusicKit not initialized');
      }

      if (!musicKit.isAuthorized) {
        await musicKit.authorize();
      }

      const apiUrl = `${import.meta.env.VITE_API_ENDPOINT}/apple-music`;
      console.log('Attempting to fetch from:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      const tokenData = {
        authenticated: data.authenticated,
        timestamp: data.timestamp,
        requestId: data.requestId,
        expiresAt: Date.now() + (3600 * 1000)
      };

      const encrypted = encryptToken(tokenData);
      localStorage.setItem('apple_music_auth', encrypted);
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth Error:', error);
      setAuthError(`Failed to authenticate with Apple Music: ${error.message}`);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (musicKit && musicKit.isAuthorized) {
        await musicKit.unauthorize();
      }
      localStorage.removeItem('apple_music_auth');
      setIsAuthenticated(false);
      setAuthError(null);
    } catch (error) {
      console.error('Error during disconnect:', error);
      setAuthError('Failed to disconnect from Apple Music');
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Apple Music Connection</h2>
      
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {authError}
        </div>
      )}

      {isAuthenticated ? (
        <div>
          <p className="text-green-600 mb-4">Connected to Apple Music</p>
          <button
            onClick={handleDisconnect}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            disabled={isLoading}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleAuthenticationWithRetry()}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          disabled={isLoading || !initializationComplete}
        >
          {isLoading ? 'Connecting...' : 'Connect Apple Music'}
        </button>
      )}

      {!initializationComplete && (
        <p className="mt-2 text-gray-600">Initializing Apple Music...</p>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>API Endpoint: {import.meta.env.VITE_API_ENDPOINT}</p>
      </div>
    </div>
  );
};

export default AppleMusicAuth;