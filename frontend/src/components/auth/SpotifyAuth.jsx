import React, { useEffect, useState } from 'react';

const SpotifyAuth = () => {
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) return;
      
      // Check if we've already processed this code
      if (sessionStorage.getItem('spotify_code') === code) {
        console.log('Code already processed');
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch(`${API_ENDPOINT}/spotify/callback?code=${code}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Store the tokens
        localStorage.setItem('spotify_tokens', JSON.stringify(data));
        sessionStorage.setItem('spotify_code', code);
        setAuthSuccess(true);
        
      } catch (error) {
        console.error('Auth error:', error);
        setAuthError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [API_ENDPOINT]);

  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private user-read-email playlist-read-private playlist-read-collaborative`;
    
    window.location.href = authUrl;
  };

  if (isLoading) {
    return <div>Connecting to Spotify...</div>;
  }

  if (authSuccess) {
    return <div>Successfully connected to Spotify!</div>;
  }

  return (
    <div>
      {authError && <div style={{ color: 'red' }}>{authError}</div>}
      <button onClick={handleLogin}>Connect Spotify</button>
    </div>
  );
};

export default SpotifyAuth;