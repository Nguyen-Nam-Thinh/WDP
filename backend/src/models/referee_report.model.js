const mongoose = require('mongoose');
const {
  PRE_RACE_TRACK_CONDITIONS,
  PRE_CHECK_FAIL_CATEGORIES,
  PENALTY_REASON_CODES,
  POST_RACE_VET_ORDER_TYPES,
} = require('../config/constants');

const lateScratchingSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    category: {
      type: String,
      enum: PRE_CHECK_FAIL_CATEGORIES,
      required: true,
    },
    note: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, required: true },
    scratchedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const preRaceReportSchema = new mongoose.Schema(
  {
    trackCondition: {
      type: String,
      enum: [...PRE_RACE_TRACK_CONDITIONS, ''],
      default: '',
    },
    trackConditionNote: { type: String, trim: true, default: '' },
    lateScratchings: { type: [lateScratchingSchema], default: [] },
    riderChanges: { type: [String], default: [] },
    gearChanges: { type: [String], default: [] },
    vetChecks: { type: [String], default: [] },
  },
  { _id: false },
);

const performanceExplanationSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    label: { type: String, trim: true, required: true },
    summonedRoles: {
      type: [{ type: String, enum: ['jockey', 'owner'] }],
      default: [],
    },
    explanation: { type: String, trim: true, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const vetOrderSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    label: { type: String, trim: true, required: true },
    orderType: {
      type: String,
      enum: POST_RACE_VET_ORDER_TYPES,
      required: true,
    },
    note: { type: String, trim: true, default: '' },
    orderedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const postRaceReportSchema = new mongoose.Schema(
  {
    performanceExplanations: { type: [performanceExplanationSchema], default: [] },
    vetOrders: { type: [vetOrderSchema], default: [] },
  },
  { _id: false },
);

const incidentSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', default: null },
    type: {
      type: String,
      enum: ['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other'],
      required: true,
    },
    action: { type: String, trim: true, default: '' },
    recordedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ['manual', 'live_flag'], default: 'manual' },
    status: { type: String, enum: ['draft', 'resolved'], default: 'resolved' },
    raceTimeMs: { type: Number, default: null },
    flaggedAt: { type: Date, default: null },
    resolution: {
      verdict: {
        type: String,
        enum: ['none', 'warning', 'fine', 'disqualified'],
        default: null,
      },
      fineAmount: { type: Number, default: null, min: 0 },
      fineTargetRole: { type: String, enum: ['owner', 'jockey'], default: null },
      fineTargetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reasonCode: {
        type: String,
        enum: [...PENALTY_REASON_CODES, null],
        default: null,
      },
      suspensionDays: { type: Number, default: null, min: 0 },
      note: { type: String, trim: true, default: '' },
      resolvedAt: { type: Date, default: null },
    },
  },
  { _id: true },
);

const complaintSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'jockey'], required: true },
    targetHorseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    refereeNote: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const refereeReportSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, unique: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    incidents: { type: [incidentSchema], default: [] },
    complaints: { type: [complaintSchema], default: [] },
    preCheckSummary: { type: String, trim: true, default: '' }, // deprecated — lazy migrate
    preRaceReport: { type: preRaceReportSchema, default: () => ({}) },
    postRaceReport: { type: postRaceReportSchema, default: () => ({}) },
    overallNotes: { type: String, trim: true, default: '' },
    /** Pre-race lifecycle (must be approved before simulation) */
    preRaceStatus: {
      type: String,
      enum: ['draft', 'pending_approval', 'rejected', 'approved'],
      default: 'draft',
    },
    preRaceSubmittedAt: { type: Date, default: null },
    preRaceReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    preRaceReviewedAt: { type: Date, default: null },
    preRaceRejectReason: { type: String, trim: true, default: '' },
    /** Post-race / Official lifecycle */
    status: {
      type: String,
      // 'submitted' kept for legacy docs — lazy-migrated to pending_approval
      enum: ['draft', 'pending_approval', 'rejected', 'approved', 'submitted'],
      default: 'draft',
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

refereeReportSchema.index({ refereeId: 1 });

const RefereeReport = mongoose.model('RefereeReport', refereeReportSchema);

module.exports = { RefereeReport, PRE_RACE_TRACK_CONDITIONS };
