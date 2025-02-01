import React from 'react';
import SpotifyAuth from './SpotifyAuth';
import AppleMusicAuth from './AppleMusicAuth';

const TestPage = () => {
  console.log('TestPage rendering');  // Debug log
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Music Service Authentication
        </h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Spotify Authentication</h2>
            <SpotifyAuth />
          </div>

          {/* Debug message to verify this section renders */}
          <div className="pt-6 border-t border-gray-200">
            <p>Apple Music Section:</p>
            <AppleMusicAuth />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;