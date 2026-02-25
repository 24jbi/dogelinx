import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./components/Landing.jsx";
import AvatarCustomizer from "./components/AvatarCustomizer.jsx";
import GamesBrowser from "./components/GamesBrowser.jsx";
import GamePlayer from "./components/GamePlayer.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page at root */}
        <Route path="/" element={<Landing />} />
        
        {/* Avatar customizer at /avatar */}
        <Route path="/avatar" element={<AvatarCustomizer />} />
        
        {/* Games browser at /games */}
        <Route path="/games" element={<GamesBrowser />} />
        
        {/* Play a game at /play/:gameId */}
        <Route path="/play/:gameId" element={<GamePlayer />} />
        
        {/* Redirect any other routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
