import React from 'react';
import {
  Gamepad2,
  Layers,
  FastForward,
  Target,
  BarChart2,
  Volume2,
  VolumeX,
  Settings,
  BrainCircuit
} from 'lucide-react';
import './Header.css';

export function Header({
  activeMode,
  onSelectMode,
  soundEnabled,
  onToggleSound,
  onOpenSettings
}) {
  const navTabs = [
    { id: 'play', label: 'Play AI', icon: Gamepad2 },
    { id: 'analysis', label: 'Analysis', icon: Layers },
    { id: 'engine_vs_engine', label: 'Self-Play', icon: FastForward },
    { id: 'puzzles', label: 'Puzzles', icon: Target },
    { id: 'review', label: 'Game Review', icon: BarChart2 }
  ];

  return (
    <header className="app-header">
      {/* Logo & Brand */}
      <div className="header-brand" onClick={() => onSelectMode('play')}>
        <div className="brand-icon-wrapper">
          <BrainCircuit size={22} color="var(--neon-cyan)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="brand-title">Neuro-Chess</span>
          <span className="brand-badge">v2.0 AI</span>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <nav className="header-nav">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeMode === tab.id ? 'active' : ''}`}
              onClick={() => onSelectMode(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Header Actions */}
      <div className="header-actions">
        <button
          className="btn-icon"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {soundEnabled ? <Volume2 size={18} color="var(--neon-cyan)" /> : <VolumeX size={18} />}
        </button>
        <button className="btn-icon" onClick={onOpenSettings} title="Settings & Themes">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
