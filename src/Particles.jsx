import React, { useEffect, useRef } from 'react';

const Particles = ({ bursts, width, height }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Generate particles from burst events
  useEffect(() => {
    if (!bursts || bursts.length === 0) return;
    const latest = bursts[bursts.length - 1];
    const count = latest.count || 12;
    const newParticles = Array.from({ length: count }, () => ({
      x: latest.x,
      y: latest.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      r: Math.random() * 3 + 1,
      life: 1,
      decay: Math.random() * 0.02 + 0.015,
      color: latest.color || '#FFD700',
    }));
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [bursts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const alive = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= p.decay;
        if (p.life <= 0) continue;
        alive.push(p);
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      particlesRef.current = alive;
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
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}
    />
  );
};

export default Particles;
