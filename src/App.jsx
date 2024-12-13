import React, { useState } from 'react';
import VideoCall from './components/VideoCall';
import AudioCall from './components/AudioCall';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('video'); // Default to Video Call

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="app-container">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => handleTabChange('video')}
        >
          Video Call
        </button>
        <button
          className={`tab-button ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => handleTabChange('audio')}
        >
          Audio Call
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'video' ? <VideoCall /> : <AudioCall />}
      </div>
    </div>
  );
}

export default App;
