import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api/auth';

const SOCKET_URL = API_URL.replace('/api/v1', '');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocketHorse {
  horseId: string;
  horseName: string;
  jockeyName: string | null;
  jockeyStyle?: 'aggressive' | 'balanced' | 'conservative';
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
  jockeyStyle?: string;
  // New: 3-phase speed profile [p0, p1, p2] — replaces flat speedFactor
  speedProfile?: [number, number, number];
  // Legacy fallback (old backend)
  speedFactor?: number;
  noiseAmplitude: number;
  noiseFreq: number;
  noisePhase: number;
}

// ─── Phase-based progress calculation ────────────────────────────────────────
// Integrates a 3-segment speed profile over t∈[0,1].
// Phase boundaries: [0–0.33], [0.33–0.66], [0.66–1.0]
// Each segment's contribution to total progress is proportional to its speed.
// The integral naturally sums to baseFactor * 1.0 since profile values integrate to ~1.
function progressFromProfile(profile: [number, number, number], t: number): number {
  const t1 = 0.33, t2 = 0.66;
  if (t <= 0) return 0;
  if (t <= t1) {
    return profile[0] * t;
  } else if (t <= t2) {
    return profile[0] * t1 + profile[1] * (t - t1);
  } else {
    return profile[0] * t1 + profile[1] * (t2 - t1) + profile[2] * (t - t2);
  }
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

      const computed = anim.horses.map(h => {
        // Noise fades to 0 as race ends → final order converges to server order
        const fade = 1 - progress;
        const noise = h.noiseAmplitude * 100 * fade *
          Math.sin(2 * Math.PI * h.noiseFreq * progress + h.noisePhase);

        let base: number;
        if (h.speedProfile) {
          // Phase-based: integrate speed profile up to current time, scale to 100%
          const rawProgress = progressFromProfile(h.speedProfile, progress);
          // Normalize: at t=1.0, progressFromProfile returns ~baseFactor
          // We want winner to reach ~100% so divide by expected max (profile[0]*0.33 + profile[1]*0.33 + profile[2]*0.34)
          const expectedMax = h.speedProfile[0] * 0.33 + h.speedProfile[1] * 0.33 + h.speedProfile[2] * 0.34;
          base = (rawProgress / Math.max(expectedMax, 0.01)) * 100;
        } else {
          // Legacy fallback for old backend
          base = (h.speedFactor ?? 1.0) * progress * 100;
        }

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
      trackCondition?: string;
      horses: AnimHorse[];
    }) => {
      if (data.raceId !== raceId) return;

      setHorses(data.horses.map(h => ({
        horseId: h.horseId,
        horseName: h.horseName,
        jockeyName: h.jockeyName,
        jockeyStyle: h.jockeyStyle,
      })));
      setPhase('racing');

      stopAnimLoop();
      startAnimLoop(data.horses, data.raceDurationMs ?? 30_000);
    });

    // race:progress kept for backwards compat but no longer emitted by backend
    socket.on('race:progress', (data: { raceId: string; elapsed: number; total: number; positions: SocketPosition[] }) => {
      if (data.raceId !== raceId) return;
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
