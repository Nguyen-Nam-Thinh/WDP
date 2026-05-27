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
      horseWinRate: 0.4,
      gradeWeight: 0.15,
      pointsWeight: 0.2,
      jockeyWinRate: 0.25,
    },
    gradeWeights: { Maiden: 0.25, G3: 0.5, G2: 0.75, G1: 1.0 },
    softmaxBeta: 5,
  },
  recommendation: {
    cfWeight: 0.6,
    cbWeight: 0.4,
  },
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
};
