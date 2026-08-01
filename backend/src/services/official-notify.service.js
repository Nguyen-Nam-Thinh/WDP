const { Race } = require('../models/race.model');
const { RaceResult } = require('../models/race_result.model');
const { Bet } = require('../models/bet.model');
const { Registration } = require('../models/registration.model');
const { createManyNotifications } = require('./notification.service');

/**
 * After admin approve + settle: notify owners, jockeys, spectators, referee.
 */
async function notifyOfficialSettlement(raceId, refereeId) {
  const race = await Race.findById(raceId).select('name');
  if (!race) return;

  const results = await RaceResult.find({ raceId })
    .populate('horseId', 'name')
    .populate('jockeyId', 'fullName')
    .sort({ position: 1 });

  const regs = await Registration.find({ raceId }).select('ownerId jockeyId horseId');
  const ownerByHorse = new Map();
  for (const reg of regs) {
    if (reg.horseId) ownerByHorse.set(reg.horseId.toString(), reg.ownerId);
  }

  const notifications = [];
  const rankingLines = results
    .filter((r) => !r.disqualified && r.position)
    .slice(0, 6)
    .map((r) => {
      const name = r.horseId?.name || 'Ngựa';
      const prize = r.prizeAmount > 0 ? ` (+${r.prizeAmount.toLocaleString('vi-VN')} coins)` : '';
      return `#${r.position} ${name}${prize}`;
    })
    .join(' · ');

  // Owners + jockeys from results
  for (const r of results) {
    const horseName = r.horseId?.name || 'Ngựa';
    const ownerId = ownerByHorse.get(r.horseId?._id?.toString() || r.horseId?.toString());

    if (ownerId) {
      if (r.disqualified) {
        notifications.push({
          userId: ownerId,
          type: 'results_official',
          title: `Kết quả Official — ${race.name}`,
          message: `${horseName} bị Disqualified. Bảng xếp hạng đã chốt.`,
          data: { raceId, position: null, disqualified: true, prizeAmount: 0 },
        });
      } else {
        notifications.push({
          userId: ownerId,
          type: r.prizeAmount > 0 ? 'prize_received' : 'results_official',
          title: r.prizeAmount > 0
            ? `Nhận thưởng Official — ${race.name}`
            : `Kết quả Official — ${race.name}`,
          message: r.prizeAmount > 0
            ? `${horseName} hạng ${r.position} — +${r.prizeAmount.toLocaleString('vi-VN')} coins · +${r.pointsEarned} pts`
            : `${horseName} hạng ${r.position}. ${rankingLines}`,
          data: {
            raceId,
            position: r.position,
            prizeAmount: r.prizeAmount,
            pointsEarned: r.pointsEarned,
            official: true,
          },
        });
      }
    }

    if (r.jockeyId) {
      const jid = r.jockeyId._id || r.jockeyId;
      notifications.push({
        userId: jid,
        type: 'results_official',
        title: `Kết quả Official — ${race.name}`,
        message: r.disqualified
          ? `${horseName} DQ.`
          : `Bạn cưỡi ${horseName} về hạng ${r.position}.`,
        data: { raceId, position: r.position, disqualified: !!r.disqualified, official: true },
      });
    }
  }

  // Spectators with settled bets
  const bets = await Bet.find({
    raceId,
    status: { $in: ['won', 'lost', 'refunded'] },
  }).select('spectatorId status payoutAmount');

  const seenSpec = new Set();
  for (const bet of bets) {
    const sid = bet.spectatorId.toString();
    if (seenSpec.has(sid)) continue;
    seenSpec.add(sid);

    if (bet.status === 'won') {
      notifications.push({
        userId: bet.spectatorId,
        type: 'bet_won',
        title: `Cược thắng — ${race.name}`,
        message: `Kết quả Official đã chốt. Bạn nhận ${(bet.payoutAmount || 0).toLocaleString('vi-VN')} coins.`,
        data: { raceId, betId: bet._id, official: true },
      });
    } else if (bet.status === 'lost') {
      notifications.push({
        userId: bet.spectatorId,
        type: 'bet_lost',
        title: `Cược thua — ${race.name}`,
        message: `Kết quả Official đã chốt. ${rankingLines || 'Xem bảng xếp hạng.'}`,
        data: { raceId, betId: bet._id, official: true },
      });
    } else {
      notifications.push({
        userId: bet.spectatorId,
        type: 'bet_refunded',
        title: `Hoàn cược — ${race.name}`,
        message: 'Kết quả Official — cược đã được hoàn.',
        data: { raceId, betId: bet._id, official: true },
      });
    }
  }

  // Pending spectators (edge: settle failed?) — still tell them official
  const pending = await Bet.find({ raceId, status: 'pending' }).select('spectatorId');
  for (const bet of pending) {
    const sid = bet.spectatorId.toString();
    if (seenSpec.has(sid)) continue;
    seenSpec.add(sid);
    notifications.push({
      userId: bet.spectatorId,
      type: 'results_official',
      title: `Kết quả Official — ${race.name}`,
      message: rankingLines || 'Biên bản đã được duyệt.',
      data: { raceId, official: true },
    });
  }

  if (refereeId) {
    notifications.push({
      userId: refereeId,
      type: 'results_official',
      title: `Biên bản đã được duyệt — ${race.name}`,
      message: `Admin đã duyệt. ${rankingLines}`,
      data: { raceId, official: true },
    });
  }

  if (notifications.length) {
    await createManyNotifications(notifications);
  }
}

module.exports = { notifyOfficialSettlement };
