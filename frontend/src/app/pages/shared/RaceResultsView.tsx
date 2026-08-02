import { useEffect, useState, useCallback } from 'react';
import { ResultsConfirmPanel } from '../referee/ResultsConfirmPanel';
import { raceApi, type Race } from '../../api/race';
import { toast } from 'sonner';

export function RaceResultsView({ token }: { token: string }) {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRaces = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await raceApi.getRaces(token, { status: 'finished,cancelled', limit: 100 });
      setRaces(res.races || []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách cuộc đua');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

  return <ResultsConfirmPanel token={token} races={races} loading={loading} readOnly={true} />;
}
