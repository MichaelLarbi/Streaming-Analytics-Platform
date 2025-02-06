// /Infrastructure/CloudFormation/lambda/apple-music-validator/validation.js

const validateAppleMusicResponse = (data, type) => {
    switch (type) {
      case 'song':
        return validateSongData(data);
      case 'artist':
        return validateArtistData(data);
      case 'playlist':
        return validatePlaylistData(data);
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  };
  
  const validateSongData = (data) => {
    const requiredFields = ['id', 'attributes'];
    const requiredAttributes = ['name', 'durationInMillis', 'albumName'];
    const errors = [];
  
    // Check required fields
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  
    // Check required attributes
    if (data.attributes) {
      requiredAttributes.forEach(attr => {
        if (!data.attributes[attr]) {
          errors.push(`Missing required attribute: ${attr}`);
        }
      });
    }
  
    // Validate data types
    if (data.attributes?.durationInMillis && !Number.isInteger(data.attributes.durationInMillis)) {
      errors.push('Duration must be an integer');
    }
  
    if (data.attributes?.durationInMillis && data.attributes.durationInMillis < 0) {
      errors.push('Duration cannot be negative');
    }
  
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizeSongData(data) : null
    };
  };
  
  const validateArtistData = (data) => {
    const requiredFields = ['id', 'attributes'];
    const requiredAttributes = ['name', 'genreNames'];
    const errors = [];
  
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  
    if (data.attributes) {
      requiredAttributes.forEach(attr => {
        if (!data.attributes[attr]) {
          errors.push(`Missing required attribute: ${attr}`);
        }
      });
    }
  
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizeArtistData(data) : null
    };
  };
  
  const validatePlaylistData = (data) => {
    const requiredFields = ['id', 'attributes'];
    const requiredAttributes = ['name', 'description', 'trackCount'];
    const errors = [];
  
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  
    if (data.attributes) {
      requiredAttributes.forEach(attr => {
        if (!data.attributes[attr]) {
          errors.push(`Missing required attribute: ${attr}`);
        }
      });
    }
  
    if (data.attributes?.trackCount && !Number.isInteger(data.attributes.trackCount)) {
      errors.push('Track count must be an integer');
    }
  
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizePlaylistData(data) : null
    };
  };
  
  const sanitizeSongData = (data) => ({
    id: data.id,
    type: data.type,
    attributes: {
      name: data.attributes.name,
      durationInMillis: data.attributes.durationInMillis,
      albumName: data.attributes.albumName,
      artistName: data.attributes.artistName,
      genreNames: data.attributes.genreNames || [],
      isrc: data.attributes.isrc
    }
  });
  
  const sanitizeArtistData = (data) => ({
    id: data.id,
    type: data.type,
    attributes: {
      name: data.attributes.name,
      genreNames: data.attributes.genreNames,
      url: data.attributes.url
    }
  });
  
  const sanitizePlaylistData = (data) => ({
    id: data.id,
    type: data.type,
    attributes: {
      name: data.attributes.name,
      description: data.attributes.description,
      trackCount: data.attributes.trackCount,
      curatorName: data.attributes.curatorName
    }
  });
  
  module.exports = {
    validateAppleMusicResponse,
    validateSongData,
    validateArtistData,
    validatePlaylistData
  };
  