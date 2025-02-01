import React, { useState, useEffect } from 'react';
import { encryptToken, decryptToken } from './authUtils';

const AppleMusicAuth = () => {
  console.log('AppleMusicAuth component rendering');

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('AppleMusicAuth useEffect running');
    // Log the API endpoint to verify it's correct
    console.log('API Endpoint:', import.meta.env.VITE_API_ENDPOINT);
    
    const checkExistingAuth = () => {
      const encrypted = localStorage.getItem('apple_music_auth');
      if (encrypted) {
        const token = decryptToken(encrypted);
        if (token && token.expiresAt > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('apple_music_auth');
        }
      }
    };

    checkExistingAuth();
  }, []);

  const handleAuthentication = async () => {
    console.log('handleAuthentication called');
    setIsLoading(true);
    setAuthError(null);

    const apiUrl = `${import.meta.env.VITE_API_ENDPOINT}/apple-music`;
    console.log('Attempting to fetch from:', apiUrl);

    try {
      console.log('Making fetch request...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('Response received:', response);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK. Status:', response.status, 'Error:', errorText);
        throw new Error(`Authentication failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      // Store the authentication data
      const tokenData = {
        authenticated: data.authenticated,
        timestamp: data.timestamp,
        requestId: data.requestId,
        expiresAt: Date.now() + (3600 * 1000) // 1 hour expiration
      };

      const encrypted = encryptToken(tokenData);
      localStorage.setItem('apple_music_auth', encrypted);
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth Error:', error);
      setAuthError(`Failed to authenticate with Apple Music: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('apple_music_auth');
    setIsAuthenticated(false);
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
          onClick={handleAuthentication}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Apple Music'}
        </button>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>API Endpoint: {import.meta.env.VITE_API_ENDPOINT}</p>
      </div>
    </div>
  );
};

export default AppleMusicAuth;
