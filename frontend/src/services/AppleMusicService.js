// src/services/AppleMusicService.js

/**
 * Service for handling Apple Music API interactions
 * Implements caching, retry logic, and proper resource management
 */
class AppleMusicService {
  constructor() {
    this.musicKit = null;
    this.requestQueue = new Map();
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.MAX_RETRIES = 3;
    this.initialized = false;
  }

  /**
   * Initialize the MusicKit instance
   * @throws {Error} If MusicKit is not loaded
   * @returns {MusicKit} The configured MusicKit instance
   */
  initialize() {
    if (!window.MusicKit) {
      throw new Error('MusicKit JS not loaded');
    }

    if (!this.musicKit) {
      this.musicKit = window.MusicKit.getInstance();
      this.setupEventListeners();
      this.initialized = true;
    }
    
    return this.musicKit;
  }

  /**
   * Set up event listeners for MusicKit
   * @private
   */
  setupEventListeners() {
    if (!this.musicKit) return;

    this.musicKit.addEventListener('authorizationStatusDidChange', this.handleAuthChange);
    this.musicKit.addEventListener('userTokenDidChange', this.handleTokenChange);
    this.musicKit.addEventListener('playbackStateDidChange', this.handlePlaybackChange);
  }

  /**
   * Handle changes in authorization status
   * @private
   */
  handleAuthChange = async (event) => {
    console.log('Authorization status changed:', event);
    if (!event.authorizationStatus) {
      this.clearCache();
      this.abortAllRequests();
    }
  }

  /**
   * Handle changes in user token
   * @private
   */
  handleTokenChange = () => {
    console.log('User token changed');
    this.clearCache();
  }

  /**
   * Handle changes in playback state
   * @private
   */
  handlePlaybackChange = (event) => {
    console.log('Playback state changed:', event);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Abort all pending requests
   */
  abortAllRequests() {
    for (const [_, controller] of this.requestQueue) {
      controller.abort();
    }
    this.requestQueue.clear();
  }

  /**
   * Check if MusicKit is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized && !!this.musicKit;
  }

  /**
   * Check if user is authorized
   * @throws {Error} If MusicKit is not initialized or user is not authorized
   */
  checkAuthorization() {
    if (!this.isInitialized()) {
      throw new Error('MusicKit not initialized');
    }
    if (!this.musicKit.isAuthorized) {
      throw new Error('User not authorized');
    }
  }

  /**
   * Make an API request with caching and retry logic
   * @private
   * @param {string} key - Cache key
   * @param {Function} apiCall - API call function
   * @param {Object} options - Request options
   * @returns {Promise<any>}
   */
  async makeRequest(key, apiCall, options = {}) {
    this.checkAuthorization();

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Returning cached data for ${key}`);
      return cached.data;
    }

    // Cancel existing request if any
    if (this.requestQueue.has(key)) {
      console.log(`Cancelling existing request for ${key}`);
      this.requestQueue.get(key).abort();
    }

    // Setup new request
    const controller = new AbortController();
    this.requestQueue.set(key, controller);

    try {
      let lastError;
      for (let i = 0; i < this.MAX_RETRIES; i++) {
        try {
          console.log(`Attempt ${i + 1} for ${key}`);
          const data = await apiCall({ signal: controller.signal, ...options });
          
          // Cache successful response
          this.cache.set(key, {
            data,
            timestamp: Date.now()
          });
          
          return data;
        } catch (error) {
          if (error.name === 'AbortError') throw error;
          lastError = error;
          console.error(`Attempt ${i + 1} failed for ${key}:`, error);
          
          if (i < this.MAX_RETRIES - 1) {
            const delay = 1000 * Math.pow(2, i);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastError;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  /**
   * Get user's recently played tracks
   * @param {number} limit - Number of tracks to retrieve
   * @returns {Promise<Array>}
   */
  async getRecentTracks(limit = 25) {
    return this.makeRequest(
      `recent-tracks-${limit}`,
      ({ signal }) => this.musicKit.api.music('recently-played', { limit, signal })
    );
  }

  /**
   * Get user's playlists
   * @returns {Promise<Array>}
   */
  async getPlaylists() {
    return this.makeRequest(
      'playlists',
      ({ signal }) => this.musicKit.api.library.playlists({ signal })
    );
  }

  /**
   * Get tracks from a specific playlist
   * @param {string} playlistId - ID of the playlist
   * @returns {Promise<Array>}
   */
  async getPlaylistTracks(playlistId) {
    return this.makeRequest(
      `playlist-${playlistId}`,
      ({ signal }) => this.musicKit.api.library.playlist(playlistId, { signal })
    );
  }

  /**
   * Get user's library
   * @returns {Promise<Array>}
   */
  async getUserLibrary() {
    return this.makeRequest(
      'user-library',
      ({ signal }) => this.musicKit.api.library.albums({ signal })
    );
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('Cleaning up AppleMusicService');
    this.clearCache();
    this.abortAllRequests();
    
    if (this.musicKit) {
      this.musicKit.removeEventListener('authorizationStatusDidChange', this.handleAuthChange);
      this.musicKit.removeEventListener('userTokenDidChange', this.handleTokenChange);
      this.musicKit.removeEventListener('playbackStateDidChange', this.handlePlaybackChange);
    }

    this.initialized = false;
  }
}

// Export as singleton
export default new AppleMusicService();