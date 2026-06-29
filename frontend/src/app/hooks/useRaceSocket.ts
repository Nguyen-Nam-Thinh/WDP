import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api/auth';

const SOCKET_URL = API_URL.replace('/api/v1', '');

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

export interface SegmentHorseEvent {
  horseId: string;
  horseName: string;
  rank: number;
  event: 'burst' | 'fatigue' | 'overtake' | 'steady';
  speedBoost: number;
}

export interface RaceSegmentEvent {
  segment: number;
  progressPct: number;
  horses: SegmentHorseEvent[];
}

export type RacePhase = 'pre' | 'started' | 'racing' | 'finished';

interface AnimHorse {
  horseId: string;
  horseName: string;
  jockeyName: string | null;
  jockeyStyle?: string;
  speedProfile?: number[];
  segmentBoosts?: number[];
  speedFactor?: number;
  finalRank: number;
  noisePhase: number;
}

const WINNER_FINISH_T = 0.88;
const TIME_SPREAD = 0.12;
const SPRINT_MULTIPLIER = 1.15;

function computeHorseProgress(
  t: number,
  rank: number,
  totalHorses: number,
  speedProfile: number[],
): number {
  if (t <= 0) return 0;

  const phases = speedProfile.length >= 4
    ? speedProfile.slice(0, 4)
    : [...speedProfile, speedProfile[speedProfile.length - 1] ?? 1];

  const myFinishT = WINNER_FINISH_T + (rank - 1) * TIME_SPREAD / Math.max(totalHorses - 1, 1);
  const scaledT = Math.min(t / myFinishT, 1.0);

  const p: number[] = [
    phases[0],
    phases[1],
    phases[2],
    phases[3] * SPRINT_MULTIPLIER,
  ];
  const t1 = 0.25;
  const t2 = 0.5;
  const t3 = 0.75;
  let raw: number;
  if (scaledT <= t1) raw = p[0] * scaledT;
  else if (scaledT <= t2) raw = p[0] * t1 + p[1] * (scaledT - t1);
  else if (scaledT <= t3) raw = p[0] * t1 + p[1] * (t2 - t1) + p[2] * (scaledT - t2);
  else raw = p[0] * t1 + p[1] * (t2 - t1) + p[2] * (t3 - t2) + p[3] * (scaledT - t3);

  const maxRaw = p[0] * t1 + p[1] * (t2 - t1) + p[2] * (t3 - t2) + p[3] * (1 - t3);
  return Math.max(0, Math.min(100, (raw / Math.max(maxRaw, 0.01)) * 100));
}

export function useRaceSocket(raceId: string, token: string | null) {
  const [phase, setPhase] = useState<RacePhase>('pre');
  const [horses, setHorses] = useState<SocketHorse[]>([]);
  const [positions, setPositions] = useState<SocketPosition[]>([]);
  const [results, setResults] = useState<SocketResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(30);
  const [lastSegment, setLastSegment] = useState<RaceSegmentEvent | null>(null);
  const [segmentHighlights, setSegmentHighlights] = useState<Record<string, SegmentHorseEvent>>({});

  const socketRef = useRef<Socket | null>(null);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef<{ horses: AnimHorse[]; startTime: number; duration: number } | null>(null);

  const startAnimLoop = (animHorses: AnimHorse[], durationMs: number, offsetMs = 0) => {
    const startTime = performance.now() - offsetMs;
    animRef.current = { horses: animHorses, startTime, duration: durationMs };

    const loop = () => {
      const anim = animRef.current;
      if (!anim) return;

      const elapsedMs = performance.now() - anim.startTime;
      const t = Math.min(elapsedMs, anim.duration);
      const progress = t / anim.duration;

      const totalHorses = anim.horses.length;
      const computed = anim.horses.map(h => {
        let progressPct: number;
        if (h.speedProfile) {
          progressPct = computeHorseProgress(progress, h.finalRank, totalHorses, h.speedProfile);
        } else {
          const myFinishT = WINNER_FINISH_T + (h.finalRank - 1) * TIME_SPREAD / Math.max(totalHorses - 1, 1);
          progressPct = (h.speedFactor ?? 1.0) * Math.min(progress / myFinishT, 1.0) * 100;
        }
        return {
          horseId: h.horseId,
          horseName: h.horseName,
          progressPct: Math.round(progressPct * 10) / 10,
        };
      });

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
      elapsedMs?: number;
    }) => {
      if (data.raceId !== raceId) return;

      setHorses(data.horses.map(h => ({
        horseId: h.horseId,
        horseName: h.horseName,
        jockeyName: h.jockeyName,
        jockeyStyle: h.jockeyStyle as SocketHorse['jockeyStyle'],
      })));
      setPhase('racing');
      setLastSegment(null);
      setSegmentHighlights({});

      stopAnimLoop();
      startAnimLoop(data.horses, data.raceDurationMs ?? 30_000, data.elapsedMs ?? 0);
    });

    socket.on('race:segment', (data: RaceSegmentEvent & { raceId: string }) => {
      if (data.raceId !== raceId) return;
      setLastSegment(data);
      const map: Record<string, SegmentHorseEvent> = {};
      data.horses.forEach(h => { map[h.horseId] = h; });
      setSegmentHighlights(map);
      setTimeout(() => setSegmentHighlights({}), 2500);
    });

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
      setLastSegment(null);
      setSegmentHighlights({});
    });

    return () => {
      stopAnimLoop();
      socket.emit('leave:race', raceId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [raceId, token]);

  return { phase, horses, positions, results, elapsed, total, lastSegment, segmentHighlights };
}
