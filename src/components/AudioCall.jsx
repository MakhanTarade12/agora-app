import React, { useState, useRef, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import './AudioCall.css';

const AudioCall = () => {
  const appId = 'e8733add3f39444aba0898fc5952283d'; // Agora App ID
  const client = useRef(null);
  const localAudioTrack = useRef(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [channelName, setChannelName] = useState('');
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('publisher');
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'channelName') setChannelName(value);
    if (name === 'uid') setUid(value);
    if (name === 'role') setRole(value);
  };

  const fetchToken = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`https://api-serviceprovider.techfluxsolutions.com/api/partner/agora_token`, {
        channel_name: channelName,
        uid: parseInt(uid),
        role,
      });

      if (response.data && response.data.token) {
        setToken(response.data.token);
      } else {
        setStatus('Failed to fetch token. Please try again.');
      }
    } catch (error) {
      setStatus(`Error fetching token: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startCall = async () => {
    if (!token || !channelName || uid === '' || !appId) {
      setStatus('Missing required parameters (appId, channelName, uid, or token) to start the call.');
      return;
    }

    try {
      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Listen for remote user events
      client.current.on('user-published', async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      client.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        }
      });

      await client.current.join(appId, channelName, token, parseInt(uid));

      if (role === 'publisher') {
        localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
        await client.current.publish([localAudioTrack.current]);
        setStatus('Audio track published successfully');
      } else {
        setStatus('Joined as a subscriber');
      }
    } catch (error) {
      setStatus(`Error starting the call: ${error.message}`);
    }
  };

  const handleStartCall = async () => {
    await fetchToken();
    await startCall();
  };

  const handleDisconnect = async () => {
    if (client.current) {
      await client.current.leave();
      if (localAudioTrack.current) localAudioTrack.current.close();
      setStatus('Disconnected');
    }
  };

  useEffect(() => {
    return () => {
      if (client.current) {
        client.current.leave();
        if (localAudioTrack.current) localAudioTrack.current.close();
      }
    };
  }, []);

  return (
    <div className="audio-call-container">
      <h2>Start Audio Call</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>
            Channel Name:
            <input
              type="text"
              name="channelName"
              value={channelName}
              onChange={handleInputChange}
              placeholder="Enter channel name"
              required
            />
          </label>
        </div>
        <div>
          <label>
            User ID:
            <input
              type="number"
              name="uid"
              value={uid}
              onChange={handleInputChange}
              placeholder="Enter UID"
              required
            />
          </label>
        </div>
        <div>
          <label>
            Role:
            <select name="role" value={role} onChange={handleInputChange}>
              <option value="publisher">Publisher</option>
              <option value="subscriber">Subscriber</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={handleStartCall} disabled={loading}>
          {loading ? 'Loading...' : 'Start Call'}
        </button>
      </form>
      <div>
        <h3>Remote Audios</h3>
        {remoteUsers.map((user) => (
          <div key={user.uid}>
            <p>Remote User: {user.uid}</p>
            <audio autoPlay ref={(node) => node && user.audioTrack.play(node)} />
          </div>
        ))}
      </div>
      <div>
        <button onClick={handleDisconnect} className="disconnect-button">
          Disconnect
        </button>
      </div>
      {status && <p>{status}</p>}
    </div>
  );
};

export default AudioCall;
