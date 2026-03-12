import React, { useEffect, useRef } from 'react';

const Starfield = ({ width, height }) => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Create stars
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    }));
    starsRef.current = stars;

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const time = Date.now() * 0.001;
      for (const s of stars) {
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time * s.speed + s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    />
  );
};

export default Starfield;
