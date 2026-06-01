import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api/auth';

const SOCKET_URL = API_URL.replace('/api/v1', '');

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

export function useRaceSocket(raceId: string, token: string | null) {
  const [phase, setPhase] = useState<RacePhase>('pre');
  const [horses, setHorses] = useState<SocketHorse[]>([]);
  const [positions, setPositions] = useState<SocketPosition[]>([]);
  const [results, setResults] = useState<SocketResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(30);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!raceId) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:race', raceId);
    });

    socket.on('race:started', (data: { raceId: string; raceName: string; horses: SocketHorse[] }) => {
      if (data.raceId !== raceId) return;
      setHorses(data.horses);
      setPhase('started');
    });

    socket.on('race:progress', (data: { raceId: string; elapsed: number; total: number; positions: SocketPosition[] }) => {
      if (data.raceId !== raceId) return;
      setPositions(data.positions);
      setElapsed(data.elapsed);
      setTotal(data.total);
      setPhase('racing');
    });

    socket.on('race:finished', (data: { raceId: string; results: SocketResult[] }) => {
      if (data.raceId !== raceId) return;
      setResults(data.results);
      setPhase('finished');
    });

    return () => {
      socket.emit('leave:race', raceId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [raceId, token]);

  return { phase, horses, positions, results, elapsed, total };
}
