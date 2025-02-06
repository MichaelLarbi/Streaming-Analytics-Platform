// src/components/auth/AppleMusicTest.jsx
import React, { useState, useEffect } from 'react';
import AppleMusicService from '../../services/AppleMusicService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

const AppleMusicTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    const results = {};

    try {
      // Test 1: Initialization
      try {
        AppleMusicService.initialize();
        results.initialization = 'Success';
      } catch (err) {
        results.initialization = `Failed: ${err.message}`;
      }

      // Test 2: Check Authorization
      try {
        AppleMusicService.checkAuthorization();
        results.authorization = 'Success';
      } catch (err) {
        results.authorization = `Failed: ${err.message}`;
      }

      // Test 3: Get Recent Tracks
      try {
        const tracks = await AppleMusicService.getRecentTracks(5);
        results.recentTracks = `Success: Retrieved ${tracks?.length || 0} tracks`;
      } catch (err) {
        results.recentTracks = `Failed: ${err.message}`;
      }

      // Test 4: Get Playlists
      try {
        const playlists = await AppleMusicService.getPlaylists();
        results.playlists = `Success: Retrieved ${playlists?.length || 0} playlists`;
      } catch (err) {
        results.playlists = `Failed: ${err.message}`;
      }

      // Test 5: Get User Library
      try {
        const library = await AppleMusicService.getUserLibrary();
        results.library = `Success: Retrieved library data`;
      } catch (err) {
        results.library = `Failed: ${err.message}`;
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setTestResults(results);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      AppleMusicService.cleanup();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Apple Music Integration Tests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Tests'}
          </button>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {Object.entries(testResults).length > 0 && (
            <div className="space-y-2">
              {Object.entries(testResults).map(([test, result]) => (
                <div
                  key={test}
                  className={`p-3 rounded ${
                    result.includes('Success')
                      ? 'bg-green-100 border border-green-400 text-green-700'
                      : 'bg-red-100 border border-red-400 text-red-700'
                  }`}
                >
                  <strong>{test}:</strong> {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppleMusicTest;