// authUtils.js
export const encryptToken = (token) => {
  // Simple encryption for demo - in production use a proper encryption library
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(token));
  return btoa(String.fromCharCode(...new Uint8Array(data)));
};

export const decryptToken = (encrypted) => {
  try {
    const decoder = new TextDecoder();
    const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    return JSON.parse(decoder.decode(data));
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
};

export const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

export const clearAuthData = () => {
  try {
    localStorage.removeItem('spotify_auth');
    sessionStorage.removeItem('spotify_auth_code');
    sessionStorage.removeItem('spotify_auth_state');
    sessionStorage.removeItem('spotify_processing');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};