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

const BET_MULTIPLIERS = {
  win: 3,
  place: 2,
  show: 1.5,
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

// Track condition — randomly assigned at race start
const TRACK_CONDITIONS = ['dry', 'wet', 'muddy'];

// Per-phase speed multipliers [phase1, phase2, phase3] for animation
// Values integrate to ~1.0 so final distance covered is preserved per horse
const JOCKEY_STYLE_SPEED_PROFILES = {
  aggressive:   [1.30, 1.00, 0.70], // leads early, fades in stretch
  balanced:     [1.00, 1.00, 1.00], // steady pace throughout
  conservative: [0.70, 1.00, 1.30], // holds back, surges late
};

module.exports = {
  POINTS_BY_GRADE,
  PRIZE_RATIO,
  GRADE_THRESHOLDS,
  BET_MULTIPLIERS,
  REFUND_RATES,
  CUTOFFS,
  CRON_INTERVALS,
  AI_CONFIG,
  TRACK_CONDITIONS,
  JOCKEY_STYLE_SPEED_PROFILES,
};
