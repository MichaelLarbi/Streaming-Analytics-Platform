import React from 'react';
import SpotifyAuth from './SpotifyAuth';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Spotify OAuth Test
        </h1>
        <SpotifyAuth />
        <div className="mt-4 text-sm text-gray-600">
          <p>Test Instructions:</p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>Click the "Connect Spotify Account" button</li>
            <li>Sign in to Spotify if needed</li>
            <li>Authorize the application</li>
            <li>You should be redirected back here</li>
            <li>Check for successful authentication message</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
