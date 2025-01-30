import React from 'react';
import SpotifyAuth from './SpotifyAuth';
import AppleMusicAuth from './AppleMusicAuth';

const TestPage = () => {
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

          <div className="pt-6 border-t border-gray-200">
            <AppleMusicAuth />
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p className="font-medium mb-2">Test Instructions:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Test Spotify Authentication:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Click the "Connect Spotify Account" button</li>
                <li>Sign in to Spotify if needed</li>
                <li>Authorize the application</li>
                <li>You should be redirected back here</li>
                <li>Check for successful authentication message</li>
              </ul>
            </li>
            <li>Test Apple Music Authentication:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Click the "Connect Apple Music" button</li>
                <li>Verify the mock authentication response</li>
                <li>Check the connection status updates</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestPage;