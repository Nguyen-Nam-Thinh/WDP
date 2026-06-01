export const API_URL = 'http://10.0.2.2:5000/api/v1'; // Android emulator → localhost
// export const API_URL = 'http://192.168.x.x:5000/api/v1'; // Physical device → your LAN IP

export const BET_MULTIPLIERS = { win: 3, place: 2, show: 1.5 } as const;

export const BET_TYPE_LABEL = {
  win: 'Thắng (Top 1) — 3.0x',
  place: 'Về Đích Top 2 — 2.0x',
  show: 'Về Đích Top 3 — 1.5x',
};

export const RACE_STATUS_LABEL: Record<string, string> = {
  open: 'Đang Mở',
  closed: 'Đã Đóng',
  pre_check: 'Kiểm Tra Trước',
  running: 'Đang Diễn Ra',
  finished: 'Đã Kết Thúc',
  cancelled: 'Đã Hủy',
};

export const POINTS_BY_GRADE = {
  Maiden: [10, 5, 3, 2, 1],
  G3: [20, 10, 6, 4, 2],
  G2: [50, 25, 15, 10, 5],
  G1: [100, 50, 25, 15, 10],
} as const;
