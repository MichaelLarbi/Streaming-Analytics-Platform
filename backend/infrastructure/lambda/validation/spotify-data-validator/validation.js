
// /Infrastructure/CloudFormation/lambda/spotify-data-validator/validation.js

const validateSpotifyResponse = (data, type) => {
  switch (type) {
    case 'track':
      return validateTrackData(data);
    case 'artist':
      return validateArtistData(data);
    case 'playlist':
      return validatePlaylistData(data);
    default:
      throw new Error(`Unknown data type: ${type}`);
  }
};

const validateTrackData = (data) => {
  const requiredFields = ['id', 'name', 'popularity', 'duration_ms'];
  const errors = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate data types
  if (data.popularity && !Number.isInteger(data.popularity)) {
    errors.push('Popularity must be an integer');
  }

  if (data.duration_ms && !Number.isInteger(data.duration_ms)) {
    errors.push('Duration must be an integer');
  }

  // Validate data ranges
  if (data.popularity && (data.popularity < 0 || data.popularity > 100)) {
    errors.push('Popularity must be between 0 and 100');
  }

  if (data.duration_ms && data.duration_ms < 0) {
    errors.push('Duration cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizeTrackData(data) : null
  };
};

const validateArtistData = (data) => {
  const requiredFields = ['id', 'name', 'followers'];
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  if (data.followers && !Number.isInteger(data.followers.total)) {
    errors.push('Followers count must be an integer');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizeArtistData(data) : null
  };
};

const validatePlaylistData = (data) => {
  const requiredFields = ['id', 'name', 'tracks'];
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  if (data.tracks && !Number.isInteger(data.tracks.total)) {
    errors.push('Tracks count must be an integer');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizePlaylistData(data) : null
  };
};

const sanitizeTrackData = (data) => ({
  id: data.id,
  name: data.name,
  popularity: data.popularity,
  duration_ms: data.duration_ms,
  artists: data.artists?.map(artist => ({
    id: artist.id,
    name: artist.name
  })) || [],
  album: data.album ? {
    id: data.album.id,
    name: data.album.name
  } : null
});

const sanitizeArtistData = (data) => ({
  id: data.id,
  name: data.name,
  followers: data.followers?.total || 0,
  genres: data.genres || [],
  popularity: data.popularity
});

const sanitizePlaylistData = (data) => ({
  id: data.id,
  name: data.name,
  description: data.description || '',
  followers: data.followers?.total || 0,
  tracks: {
    total: data.tracks?.total || 0
  }
});

module.exports = {
  validateSpotifyResponse,
  validateTrackData,
  validateArtistData,
  validatePlaylistData
};
