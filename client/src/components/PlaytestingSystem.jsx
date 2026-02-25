import React, { useEffect, useState } from "react";
import { useStudio } from "../store.js";
import "../styles/playtesting.css";

export default function PlaytestingSystem() {
  const isPlaying = useStudio((s) => s.isPlaying);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);

  useEffect(() => {
    if (!isPlaying) return;

    const checkHealth = setInterval(() => {
      if (window.__healthSystem) {
        setHealth(window.__healthSystem.health);
        setMaxHealth(window.__healthSystem.maxHealth);
      }
    }, 100);

    return () => clearInterval(checkHealth);
  }, [isPlaying]);

  if (!isPlaying) return null;

  const healthPercent = (health / maxHealth) * 100;

  return (
    <div className="playtesting-hud">
      <div className="healthbar-container">
        <div className="healthbar">
          <div
            className="healthbar-fill"
            style={{
              width: `${healthPercent}%`,
              transition: "width 0.1s ease",
            }}
          />
        </div>
        <span className="healthbar-text">{Math.ceil(health)}/{maxHealth}</span>
      </div>
    </div>
  );
}
