import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SpotifyAuth from "../src/components/auth/SpotifyAuth";

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
      </nav>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/spotify-auth" element={<SpotifyAuth />} />
      </Routes>
    </Router>
  );
};

export default App;
