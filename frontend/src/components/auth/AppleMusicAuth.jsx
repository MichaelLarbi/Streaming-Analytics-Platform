// frontend/src/components/auth/AppleMusicAuth.jsx

import React, { useState, useEffect } from 'react';
import { encryptToken, decryptToken } from './authUtils';

const AppleMusicAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on component mount
  useEffect(() => {
    const checkExistingAuth = () => {
      const encrypted = localStorage.getItem('apple_music_auth');
      if (encrypted) {
        const token = decryptToken(encrypted);
        if (token && token.expiresAt > Date.now()) {
          setIsAuthenticated(true);
        } else {
          // Clear expired token
          localStorage.removeItem('apple_music_auth');
        }
      }
    };

    checkExistingAuth();
  }, []);

  const handleAuthentication = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}/apple-music`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      // Store token with expiration
      const tokenData = {
        token: data.token,
        expiresAt: Date.now() + (data.expiresIn * 1000)
      };

      const encrypted = encryptToken(tokenData);
      localStorage.setItem('apple_music_auth', encrypted);
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth Error:', error);
      setAuthError('Failed to authenticate with Apple Music');
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
    </div>
  );
};

export default AppleMusicAuth;
