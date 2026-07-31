const mongoose = require('mongoose');
const { PRE_RACE_TRACK_CONDITIONS } = require('../config/constants');

const lateScratchingSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
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

const incidentSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', default: null },
    type: {
      type: String,
      enum: ['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    action: { type: String, trim: true, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const refereeReportSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, unique: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    incidents: { type: [incidentSchema], default: [] },
    preCheckSummary: { type: String, trim: true, default: '' }, // deprecated — lazy migrate
    preRaceReport: { type: preRaceReportSchema, default: () => ({}) },
    overallNotes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

refereeReportSchema.index({ refereeId: 1 });

const RefereeReport = mongoose.model('RefereeReport', refereeReportSchema);

module.exports = { RefereeReport, PRE_RACE_TRACK_CONDITIONS };
