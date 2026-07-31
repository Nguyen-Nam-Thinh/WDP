const POINTS_BY_GRADE = {
  Maiden: [10, 5, 3, 2, 1],
  G3: [20, 10, 6, 4, 2],
  G2: [50, 25, 15, 10, 5],
  G1: [100, 50, 25, 15, 10],
};

const PRIZE_RATIO = [0.6, 0.2, 0.1, 0.05, 0.03, 0.02];

const GRADE_THRESHOLDS = {
  Maiden: 0,
  G3: 20,
  G2: 50,
  G1: 100,
};

// Parimutuel betting config
const PARIMUTUEL_CONFIG = {
  rake: 0.10,          // 10% hệ thống giữ lại từ pool
  minMultiplier: 1.1,  // tối thiểu x1.1 (không thể lỗ toàn bộ nếu thắng)
  maxMultiplier: 50,   // giới hạn tối đa tránh cực đoan
  defaultEstimate: 3,  // odds ước tính mặc định khi chưa có pool
};

const BET_ODDS_CONFIG = {
  upsetChance: 0.15,
  raceSegments: 4,
};

const REFUND_RATES = {
  ownerCancel: 0.4,
  disqualifyOwner: 0.7,
  disqualifySpectator: 1.0,
  cancelled: 1.0,
};

const CUTOFFS = {
  registrationHoursMin: 48,
  registrationHoursMax: 72,
  bettingHours: 1,
};

const CRON_INTERVALS = {
  raceCheckSeconds: 30,
};

const AI_CONFIG = {
  winProbability: {
    weights: {
      horseWinRate: 0.30,
      gradeWeight: 0.10,
      pointsWeight: 0.15,
      jockeyWinRate: 0.20,
      formFactor: 0.15,
    },
    gradeWeights: { Maiden: 0.25, G3: 0.5, G2: 0.75, G1: 1.0 },
    softmaxBeta: 5,
    formLookback: 5,
  },
  recommendation: {
    cfWeight: 0.6,
    cbWeight: 0.4,
  },
};

// Track conditions — randomly assigned at race start
// breedModifiers: speed factor per breed relative to baseline 1.0
// weightEffect: multiplier for (horseWeight/avgWeight - 1) delta — negative = lighter is faster
// preferredBonus: bonus applied when horse.preferredTrackCondition matches this condition
const TRACK_CONDITIONS = {
  dry: {
    label: 'Khô',
    speedMultiplier: 1.0,
    breedModifiers: {
      Thoroughbred: 1.05,
      Arabian: 1.03,
      'Akhal-Teke': 1.04,
      'Quarter Horse': 1.02,
      Standardbred: 1.00,
      Andalusian: 1.00,
    },
    weightEffect: -0.07, // lighter horses faster on firm ground
    preferredBonus: 1.03,
  },
  wet: {
    label: 'Ướt',
    speedMultiplier: 0.95,
    breedModifiers: {
      Standardbred: 1.03,
      'Akhal-Teke': 1.00,
      Arabian: 0.99,
      Andalusian: 0.98,
      'Quarter Horse': 0.98,
      Thoroughbred: 0.97,
    },
    weightEffect: 0.07, // heavier = better grip on wet
    preferredBonus: 1.03,
  },
  muddy: {
    label: 'Lầy',
    speedMultiplier: 0.88,
    breedModifiers: {
      Standardbred: 1.01,
      'Quarter Horse': 0.97,
      'Akhal-Teke': 0.96,
      Andalusian: 0.94,
      Arabian: 0.93,
      Thoroughbred: 0.90,
    },
    weightEffect: 0.12, // heavier horses grip mud better
    preferredBonus: 1.03,
  },
};

/** Stewards' pre-race report track rating (not simulation track conditions) */
const PRE_RACE_TRACK_CONDITIONS = ['Firm', 'Good', 'Soft', 'Heavy', 'Synthetic'];

// Jockey racing styles — per-phase speed multipliers for animation + risk/track metadata
// phases: [phase1, phase2, phase3] — integrate to ~1.0 so total distance is preserved
// riskFactor: Gaussian noise sigma used in scoring (higher = more variance)
// trackBonus: per-condition multiplier applied to horse's final score
const JOCKEY_STYLE_SPEED_PROFILES = {
  aggressive: {
    phases: [1.30, 1.00, 0.70],
    riskFactor: 0.15,
    trackBonus: { dry: 1.02, wet: 0.98, muddy: 0.95 },
    label: 'Hung hăng',
  },
  balanced: {
    phases: [1.00, 1.00, 1.00],
    riskFactor: 0.08,
    trackBonus: { dry: 1.00, wet: 1.00, muddy: 1.00 },
    label: 'Cân bằng',
  },
  conservative: {
    phases: [0.70, 1.00, 1.30],
    riskFactor: 0.10,
    trackBonus: { dry: 0.98, wet: 1.02, muddy: 1.04 },
    label: 'Bảo thủ',
  },
};

module.exports = {
  POINTS_BY_GRADE,
  PRIZE_RATIO,
  GRADE_THRESHOLDS,
  PARIMUTUEL_CONFIG,
  BET_ODDS_CONFIG,
  REFUND_RATES,
  CUTOFFS,
  CRON_INTERVALS,
  AI_CONFIG,
  TRACK_CONDITIONS,
  PRE_RACE_TRACK_CONDITIONS,
  JOCKEY_STYLE_SPEED_PROFILES,
};
