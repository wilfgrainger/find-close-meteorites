import React, { useState, useEffect } from 'react';

// You will need to replace this with your actual Cloudflare Worker URL
const API_URL = 'https://your-worker.your-subdomain.workers.dev';
const ROOM_ID = 'demo-room'; // Example room ID

const GameRoom = () => {
  const [items, setItems] = useState([]);
  const [draggedItemId, setDraggedItemId] = useState(null);

  // Load the initial layout
  useEffect(() => {
    fetch(`${API_URL}/api/room/${ROOM_ID}`)
      .then((res) => res.json())
      .then((data) => {
        // If the DB is empty, start with a default block
        if (!Array.isArray(data) || data.length === 0) {
          setItems([{ id: 'block-1', type: 'block', x: 100, y: 100 }]);
        } else {
          setItems(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load room:', err);
        // Provide default block if API is unreachable for local testing
        setItems([{ id: 'block-1', type: 'block', x: 100, y: 100 }]);
      });
  }, []);

  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e) => {
    e.preventDefault();

    if (!draggedItemId) return;

    // Get the room container bounds
    const roomRect = e.currentTarget.getBoundingClientRect();

    // Calculate new X, Y relative to the room container
    // Adjust slightly to center the dropped item
    const newX = e.clientX - roomRect.left - 25; // Assuming item is ~50px wide
    const newY = e.clientY - roomRect.top - 25;  // Assuming item is ~50px high

    // Optimistically update UI
    let movedItem = null;
    const updatedItems = items.map((item) => {
      if (item.id === draggedItemId) {
        movedItem = { ...item, x: newX, y: newY };
        return movedItem;
      }
      return item;
    });

    setItems(updatedItems);

    // Persist to Cloudflare Worker
    try {
      await fetch(`${API_URL}/api/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: movedItem.id,
          roomId: ROOM_ID,
          type: movedItem.type,
          x: newX,
          y: newY,
        }),
      });
    } catch (err) {
      console.error('Failed to save item position:', err);
    }

    setDraggedItemId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      className="game-room"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        position: 'relative',
        width: '800px',
        height: '600px',
        border: '2px solid #ccc',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden'
      }}
    >
      <h2>Room: {ROOM_ID}</h2>
      <p>Drag the block around. Its position will save to Cloudflare D1.</p>

      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          style={{
            position: 'absolute',
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: '50px',
            height: '50px',
            backgroundColor: item.type === 'character' ? 'blue' : 'red',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: item.type === 'character' ? '50%' : '8px'
          }}
        >
          {item.type === 'character' ? 'Me' : 'Box'}
        </div>
      ))}
    </div>
  );
};

export default GameRoom;
