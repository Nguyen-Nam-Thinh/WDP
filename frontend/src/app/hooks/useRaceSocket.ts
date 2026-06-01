import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api/auth';

const SOCKET_URL = API_URL.replace('/api/v1', '');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocketHorse {
  horseId: string;
  horseName: string;
  jockeyName: string | null;
}

export interface SocketPosition {
  rank: number;
  horseId: string;
  horseName: string;
  progressPct: number;
}

export interface SocketResult {
  position: number;
  horseId: string;
  horseName: string;
  jockeyName: string | null;
  finishTime: number;
  prizeAmount: number;
  pointsEarned: number;
}

export type RacePhase = 'pre' | 'started' | 'racing' | 'finished';

interface AnimHorse {
  horseId: string;
  horseName: string;
  jockeyName: string | null;
  speedFactor: number;
  noiseAmplitude: number;
  noiseFreq: number;
  noisePhase: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRaceSocket(raceId: string, token: string | null) {
  const [phase, setPhase] = useState<RacePhase>('pre');
  const [horses, setHorses] = useState<SocketHorse[]>([]);
  const [positions, setPositions] = useState<SocketPosition[]>([]);
  const [results, setResults] = useState<SocketResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(30);

  const socketRef = useRef<Socket | null>(null);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef<{ horses: AnimHorse[]; startTime: number; duration: number } | null>(null);

  // ── rAF animation loop (runs at ~60fps) ──
  const startAnimLoop = (animHorses: AnimHorse[], durationMs: number) => {
    const startTime = performance.now();
    animRef.current = { horses: animHorses, startTime, duration: durationMs };

    const loop = () => {
      const anim = animRef.current;
      if (!anim) return;

      const elapsed = performance.now() - anim.startTime;
      const t = Math.min(elapsed, anim.duration);
      const progress = t / anim.duration; // 0→1

      const computed = anim.horses.map((h) => {
        const base = h.speedFactor * progress * 100;
        // Noise fades to 0 as race ends → final order matches server-computed positions
        const fade = 1 - progress;
        const noise = h.noiseAmplitude * 100 * fade *
          Math.sin(2 * Math.PI * h.noiseFreq * progress + h.noisePhase);
        return {
          horseId: h.horseId,
          horseName: h.horseName,
          progressPct: Math.max(0, Math.min(100, base + noise)),
        };
      });

      // Sort by progressPct descending → current rank
      const sorted = [...computed].sort((a, b) => b.progressPct - a.progressPct);
      setPositions(sorted.map((h, i) => ({
        rank: i + 1,
        horseId: h.horseId,
        horseName: h.horseName,
        progressPct: Math.round(h.progressPct * 10) / 10,
      })));
      setElapsed(Math.round(t / 1000));
      setTotal(Math.round(anim.duration / 1000));

      if (t < anim.duration) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const stopAnimLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    animRef.current = null;
  };

  // ── Socket setup ──
  useEffect(() => {
    if (!raceId) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:race', raceId);
    });

    socket.on('race:started', (data: {
      raceId: string;
      raceName: string;
      raceDurationMs: number;
      horses: AnimHorse[];
    }) => {
      if (data.raceId !== raceId) return;

      setHorses(data.horses.map(h => ({
        horseId: h.horseId,
        horseName: h.horseName,
        jockeyName: h.jockeyName,
      })));
      setPhase('racing');

      stopAnimLoop();
      startAnimLoop(data.horses, data.raceDurationMs ?? 30_000);
    });

    // race:progress kept for backwards compat but no longer emitted by backend
    socket.on('race:progress', (data: { raceId: string; elapsed: number; total: number; positions: SocketPosition[] }) => {
      if (data.raceId !== raceId) return;
      // Only use if rAF loop is not running (e.g., old backend)
      if (!animRef.current) {
        setPositions(data.positions);
        setElapsed(data.elapsed);
        setTotal(data.total);
        setPhase('racing');
      }
    });

    socket.on('race:finished', (data: { raceId: string; results: SocketResult[] }) => {
      if (data.raceId !== raceId) return;
      stopAnimLoop();
      setResults(data.results);
      setPhase('finished');
    });

    return () => {
      stopAnimLoop();
      socket.emit('leave:race', raceId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [raceId, token]);

  return { phase, horses, positions, results, elapsed, total };
}
