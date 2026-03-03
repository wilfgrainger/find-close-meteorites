import React from 'react';
import { createRoot } from 'react-dom/client';
import GameRoom from './GameRoom.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<GameRoom />);
