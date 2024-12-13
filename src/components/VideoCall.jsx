import React, { useState, useRef, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import './VideoCall.css';

const VideoCall = () => {
  const appId = 'e8733add3f39444aba0898fc5952283d'; // Agora App ID
  const client = useRef(null);
  const localAudioTrack = useRef(null);
  const localVideoTrack = useRef(null);
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
      const response = await axios.post(`http://localhost:3005/api/partner/agora_token`, {
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
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          setRemoteUsers((prevUsers) => [...prevUsers, { uid: user.uid, videoTrack: remoteVideoTrack }]);
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      client.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        }
      });

      await client.current.join(appId, channelName, token, parseInt(uid));

      if (role === 'publisher') {
        localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
        localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
        await client.current.publish([localAudioTrack.current, localVideoTrack.current]);
        setStatus('Audio and video tracks published successfully');
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
      if (localVideoTrack.current) localVideoTrack.current.close();
      setStatus('Disconnected');
    }
  };

  useEffect(() => {
    return () => {
      if (client.current) {
        client.current.leave();
        if (localAudioTrack.current) localAudioTrack.current.close();
        if (localVideoTrack.current) localVideoTrack.current.close();
      }
    };
  }, []);

  return (
    <div className="video-call-container">
      <h2>Start Video Call</h2>
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
      <div className="local-video-container">
        <h3>Local Video</h3>
        <div id="local-video">
          {localVideoTrack.current && (
            <video
              ref={(node) => node && localVideoTrack.current.play(node)}
              autoPlay
              muted
              className="local-video"
            />
          )}
        </div>
        <button onClick={handleDisconnect} className="disconnect-button">
          Disconnect
        </button>
      </div>
      <div>
        <h3>Remote Videos</h3>
        <div id="remote-videos">
          {remoteUsers.map((user) => (
            <div key={user.uid}>
              <p>Remote User: {user.uid}</p>
              <video
                ref={(node) => node && user.videoTrack.play(node)}
                autoPlay
                className="remote-video"
              />
            </div>
          ))}
        </div>
      </div>
      {status && <p>{status}</p>}
    </div>
  );
};

export default VideoCall;
