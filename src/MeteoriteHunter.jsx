import React, { useState, useEffect, useRef, useCallback } from 'react';
import Starfield from './Starfield.jsx';
import Particles from './Particles.jsx';
import {
  playCollect,
  playBonusCollect,
  playHit,
  playLevelUp,
  playGameOver,
} from './useAudio.js';

/* ─── constants ─── */
const COLLECTOR_W = 70;
const COLLECTOR_H = 16;
const METEORITE_SIZE = 28;
const MAX_LIVES = 3;
const CATCHES_PER_LEVEL = 15;

const TYPES = {
  normal:  { emoji: '☄️', points: 10, color: '#b0b0b0' },
  gold:    { emoji: '🌟', points: 50, color: '#FFD700' },
  danger:  { emoji: '💥', points: 0,  color: '#ff3333' },
  shield:  { emoji: '🛡️', points: 0,  color: '#4fc3f7' },
};

const LS_KEY = 'meteorite-hunter:high';

/* ─── helpers ─── */
function loadHigh() {
  try { return parseInt(localStorage.getItem(LS_KEY), 10) || 0; } catch { return 0; }
}
function saveHigh(v) {
  try { localStorage.setItem(LS_KEY, String(v)); } catch { /* noop */ }
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ─── component ─── */
const MeteoriteHunter = () => {
  /* sizing – responsive */
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 480, h: 700 });

  useEffect(() => {
    const measure = () => {
      const w = Math.min(window.innerWidth - 16, 520);
      const h = Math.min(window.innerHeight - 16, 780);
      setSize({ w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const W = size.w;
  const H = size.h;

  /* game state */
  const [phase, setPhase] = useState('menu'); // menu | play | over
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(loadHigh);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(MAX_LIVES);
  const [combo, setCombo] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [shakeClass, setShakeClass] = useState('');
  const [bursts, setBursts] = useState([]);

  /* refs for game loop access */
  const meteorites = useRef([]);
  const collectorX = useRef(W / 2);
  const frameRef = useRef(null);
  const lastSpawn = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const shieldRef = useRef(false);
  const phaseRef = useRef('menu');
  const caughtCount = useRef(0);

  /* keep refs in sync */
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { shieldRef.current = shieldActive; }, [shieldActive]);

  /* ─── input handling (mouse & touch) ─── */
  const handlePointerMove = useCallback((e) => {
    if (phaseRef.current !== 'play') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    collectorX.current = clamp(clientX - rect.left, COLLECTOR_W / 2, W - COLLECTOR_W / 2);
  }, [W]);

  /* ─── start / restart ─── */
  const startGame = useCallback(() => {
    meteorites.current = [];
    collectorX.current = W / 2;
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    levelRef.current = 1;
    comboRef.current = 0;
    shieldRef.current = false;
    caughtCount.current = 0;
    lastSpawn.current = 0;
    setScore(0);
    setLives(MAX_LIVES);
    setLevel(1);
    setCombo(0);
    setShieldActive(false);
    setBursts([]);
    setPhase('play');
  }, [W]);

  /* ─── shake helper ─── */
  const triggerShake = useCallback(() => {
    setShakeClass('shake');
    setTimeout(() => setShakeClass(''), 300);
  }, []);

  /* ─── spawn meteorite ─── */
  const spawn = useCallback(() => {
    const lvl = levelRef.current;
    const r = Math.random();
    let type = 'normal';
    if (r < 0.05 + lvl * 0.005) type = 'shield';
    else if (r < 0.12 + lvl * 0.01) type = 'gold';
    else if (r < 0.22 + lvl * 0.015) type = 'danger';

    const speed = (1.5 + lvl * 0.35 + Math.random() * 1.2);
    meteorites.current.push({
      id: Date.now() + Math.random(),
      x: Math.random() * (W - METEORITE_SIZE * 2) + METEORITE_SIZE,
      y: -METEORITE_SIZE,
      speed,
      type,
      wobble: (Math.random() - 0.5) * 1.2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
    });
  }, [W]);

  /* ─── game loop ─── */
  useEffect(() => {
    if (phase !== 'play') return;

    const tick = (ts) => {
      if (phaseRef.current !== 'play') return;

      /* spawn */
      const interval = Math.max(300, 900 - levelRef.current * 50);
      if (ts - lastSpawn.current > interval) {
        spawn();
        lastSpawn.current = ts;
      }

      /* update meteorites */
      const colLeft = collectorX.current - COLLECTOR_W / 2;
      const colRight = collectorX.current + COLLECTOR_W / 2;
      const colY = H - 50;
      const alive = [];
      let newBursts = [];

      for (const m of meteorites.current) {
        m.y += m.speed;
        m.x += m.wobble * Math.sin(ts * 0.003 + m.id);
        m.rotation += m.rotSpeed;

        /* check collision with collector */
        const mx = m.x;
        const my = m.y + METEORITE_SIZE / 2;
        const hit = my >= colY && my <= colY + COLLECTOR_H + 8 &&
                    mx >= colLeft - 4 && mx <= colRight + 4;

        if (hit) {
          const info = TYPES[m.type];
          if (m.type === 'danger') {
            if (shieldRef.current) {
              shieldRef.current = false;
              setShieldActive(false);
              newBursts.push({ x: mx, y: my, color: '#4fc3f7', count: 8 });
              playCollect();
            } else {
              livesRef.current -= 1;
              setLives(livesRef.current);
              comboRef.current = 0;
              setCombo(0);
              triggerShake();
              playHit();
              newBursts.push({ x: mx, y: my, color: '#ff3333', count: 15 });
              if (livesRef.current <= 0) {
                setPhase('over');
                playGameOver();
                const currentHigh = highScore;
                if (scoreRef.current > currentHigh) {
                  saveHigh(scoreRef.current);
                  setHighScore(scoreRef.current);
                }
                return;
              }
            }
          } else if (m.type === 'shield') {
            shieldRef.current = true;
            setShieldActive(true);
            newBursts.push({ x: mx, y: my, color: '#4fc3f7', count: 10 });
            playBonusCollect();
          } else {
            comboRef.current += 1;
            setCombo(comboRef.current);
            const multiplier = 1 + Math.floor(comboRef.current / 5) * 0.5;
            const pts = Math.round(info.points * multiplier);
            scoreRef.current += pts;
            setScore(scoreRef.current);
            caughtCount.current += 1;
            newBursts.push({ x: mx, y: my, color: info.color, count: m.type === 'gold' ? 16 : 8 });
            m.type === 'gold' ? playBonusCollect() : playCollect();

            /* level up every 15 catches */
            if (caughtCount.current % CATCHES_PER_LEVEL === 0) {
              levelRef.current += 1;
              setLevel(levelRef.current);
              playLevelUp();
            }
          }
          continue; // remove this meteorite
        }

        /* missed (off screen) */
        if (m.y > H + METEORITE_SIZE) {
          if (m.type === 'normal' || m.type === 'gold') {
            comboRef.current = 0;
            setCombo(0);
          }
          continue;
        }

        alive.push(m);
      }
      meteorites.current = alive;

      if (newBursts.length) {
        setBursts((prev) => [...prev.slice(-20), ...newBursts]);
      }

      /* render */
      forceRender();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [phase, H, spawn, triggerShake]);

  /* force re-render for animation */
  const [, setTick] = useState(0);
  const forceRender = useCallback(() => setTick((t) => t + 1), []);

  /* ─── render ─── */
  const colX = collectorX.current;

  return (
    <div
      ref={containerRef}
      className={`game-container ${shakeClass}`}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
      onClick={phase === 'menu' ? startGame : undefined}
      style={{
        position: 'relative',
        width: W,
        height: H,
        margin: '0 auto',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0b0e2d 0%, #1a1a4e 40%, #2d1b69 100%)',
        borderRadius: 12,
        cursor: phase === 'menu' ? 'pointer' : 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <Starfield width={W} height={H} />
      <Particles bursts={bursts} width={W} height={H} />

      {/* ── HUD ── */}
      {phase === 'play' && (
        <div style={{
          position: 'absolute', top: 8, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 20, fontFamily: 'monospace', color: '#fff', fontSize: 14,
        }}>
          <div>
            <span style={{ color: '#FFD700', fontSize: 18 }}>⭐ {score}</span>
            {combo >= 3 && (
              <span style={{
                marginLeft: 8, color: '#ff6b6b', fontWeight: 'bold',
                animation: 'pulse 0.5s ease-in-out infinite alternate',
              }}>
                x{1 + Math.floor(combo / 5) * 0.5} 🔥
              </span>
            )}
          </div>
          <div>Lv {level}</div>
          <div>
            {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, MAX_LIVES - lives))}
            {shieldActive && ' 🛡️'}
          </div>
        </div>
      )}

      {/* ── Meteorites ── */}
      {phase === 'play' && meteorites.current.map((m) => (
        <div
          key={m.id}
          style={{
            position: 'absolute',
            left: m.x - METEORITE_SIZE / 2,
            top: m.y - METEORITE_SIZE / 2,
            width: METEORITE_SIZE,
            height: METEORITE_SIZE,
            fontSize: METEORITE_SIZE - 4,
            lineHeight: `${METEORITE_SIZE}px`,
            textAlign: 'center',
            transform: `rotate(${m.rotation}deg)`,
            filter: m.type === 'gold' ? 'drop-shadow(0 0 6px #FFD700)' :
                    m.type === 'danger' ? 'drop-shadow(0 0 4px #ff3333)' :
                    m.type === 'shield' ? 'drop-shadow(0 0 4px #4fc3f7)' : 'none',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          {TYPES[m.type].emoji}
        </div>
      ))}

      {/* ── Collector ── */}
      {phase === 'play' && (
        <div
          style={{
            position: 'absolute',
            left: colX - COLLECTOR_W / 2,
            top: H - 50,
            width: COLLECTOR_W,
            height: COLLECTOR_H,
            borderRadius: 8,
            background: shieldActive
              ? 'linear-gradient(90deg, #4fc3f7, #81d4fa, #4fc3f7)'
              : 'linear-gradient(90deg, #ff6b6b, #ffa502, #ff6b6b)',
            boxShadow: shieldActive
              ? '0 0 16px #4fc3f7, 0 2px 8px rgba(0,0,0,0.5)'
              : '0 0 12px rgba(255,107,107,0.6), 0 2px 8px rgba(0,0,0,0.5)',
            zIndex: 6,
            transition: 'background 0.3s',
          }}
        />
      )}

      {/* ── Menu screen ── */}
      {phase === 'menu' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 30,
          textAlign: 'center', color: '#fff', fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>☄️</div>
          <h1 style={{
            fontSize: 32, margin: 0, letterSpacing: 2,
            background: 'linear-gradient(90deg, #ff6b6b, #ffa502, #FFD700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            METEORITE HUNTER
          </h1>
          <p style={{ opacity: 0.7, margin: '12px 0 4px', fontSize: 14 }}>
            Catch meteorites ☄️ • Avoid explosions 💥
          </p>
          <p style={{ opacity: 0.5, fontSize: 12, marginBottom: 24 }}>
            Gold 🌟 = bonus • Shields 🛡️ protect you
          </p>
          <div style={{
            padding: '14px 40px', borderRadius: 30,
            background: 'linear-gradient(135deg, #ff6b6b, #ffa502)',
            fontSize: 18, fontWeight: 'bold', letterSpacing: 1,
            boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
            animation: 'pulse 1.5s ease-in-out infinite alternate',
          }}>
            TAP TO PLAY
          </div>
          {highScore > 0 && (
            <p style={{ marginTop: 20, opacity: 0.6, fontSize: 13 }}>
              🏆 Best: {highScore}
            </p>
          )}
        </div>
      )}

      {/* ── Game over screen ── */}
      {phase === 'over' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 30,
          textAlign: 'center', color: '#fff', fontFamily: 'sans-serif',
          background: 'rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💫</div>
          <h2 style={{ margin: 0, fontSize: 28 }}>GAME OVER</h2>
          <p style={{ fontSize: 20, margin: '16px 0 4px', color: '#FFD700' }}>
            Score: {score}
          </p>
          <p style={{ fontSize: 14, opacity: 0.7 }}>Level {level} reached</p>
          {score >= highScore && score > 0 && (
            <p style={{
              margin: '8px 0', fontSize: 16, color: '#ff6b6b',
              animation: 'pulse 0.6s ease-in-out infinite alternate',
            }}>
              🎉 NEW HIGH SCORE! 🎉
            </p>
          )}
          <button
            onClick={startGame}
            style={{
              marginTop: 24, padding: '12px 36px', borderRadius: 30,
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #ff6b6b, #ffa502)',
              color: '#fff', fontSize: 16, fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
            }}
          >
            PLAY AGAIN
          </button>
          <p style={{ marginTop: 16, opacity: 0.5, fontSize: 12 }}>
            🏆 Best: {highScore}
          </p>
        </div>
      )}
    </div>
  );
};

export default MeteoriteHunter;
