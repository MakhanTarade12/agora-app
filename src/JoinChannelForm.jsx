import React, { useState } from 'react';

const JoinChannelForm = ({ onJoin }) => {
  const [channelName, setChannelName] = useState('');
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('publisher'); // Initially set to 'publisher'

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert 'role' to integer (0 for publisher, 1 for subscriber)
    const roleInt = role === 'publisher' ? 0 : 1;

    onJoin({ 
      channelName, 
      uid: parseInt(uid) || 0,  // Convert uid to integer, default to 0 if invalid
      role: roleInt  // Pass the role as integer
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Channel Name"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="UID"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="publisher">Publisher</option>
        <option value="subscriber">Subscriber</option>
      </select>
      <button type="submit">Join</button>
    </form>
  );
};

export default JoinChannelForm;
