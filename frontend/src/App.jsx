import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SpotifyAuth from './components/auth/SpotifyAuth';
import AppleMusicAuth from './components/auth/AppleMusicAuth';
import AppleMusicTest from './components/auth/AppleMusicTest';
import './App.css';

const Home = () => (
  <div className="min-h-screen bg-gray-100 py-12 px-4">
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Streaming Analytics Platform
      </h1>
      <nav className="space-y-4">
        <Link
          to="/spotify-auth"
          className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Connect Spotify
        </Link>
        <br />
        <Link
          to="/apple-music-auth"
          className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mt-4"
        >
          Connect Apple Music
        </Link>
      </nav>
    </div>
  </div>
);

const AppleMusicPage = () => (
  <div className="min-h-screen bg-gray-100 py-12 px-4">
    <div className="max-w-4xl mx-auto space-y-8">
      <AppleMusicAuth />
      <AppleMusicTest />
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spotify-auth" element={<SpotifyAuth />} />
          <Route path="/apple-music-auth" element={<AppleMusicPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
