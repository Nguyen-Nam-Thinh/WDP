const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { AI_CONFIG } = require('../config/constants');

// Softmax with beta amplification (per CLAUDE.md formula)
function softmax(scores, beta = 5) {
  const exps = scores.map((s) => Math.exp(beta * s));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / total);
}

function calcScore(horse, jockeyUser) {
  const { weights, gradeWeights } = AI_CONFIG.winProbability;
  const horseWinRate = horse.raceCount > 0 ? horse.winCount / horse.raceCount : 0;
  const gradeWeight = gradeWeights[horse.currentGrade] ?? 0.25;
  const normalizedPoints = Math.min(horse.totalPoints / 100, 1);
  const jp = jockeyUser?.jockeyProfile;
  const jockeyWinRate = jp?.raceCount > 0 ? jp.winCount / jp.raceCount : 0;
  return (
    weights.horseWinRate * horseWinRate +
    weights.gradeWeight * gradeWeight +
    weights.pointsWeight * normalizedPoints +
    weights.jockeyWinRate * jockeyWinRate
  );
}

// Generate a specific reason for each horse based on their actual stats
function buildReasonFromStats(horse, jockey, rank, fieldStats) {
  const jp = jockey?.jockeyProfile;
  const winRate = horse.raceCount > 0 ? Math.round((horse.winCount / horse.raceCount) * 100) : 0;
  const jWinRate = jp?.raceCount > 0 ? Math.round((jp.winCount / jp.raceCount) * 100) : 0;
  const parts = [];

  // --- Đánh giá ngựa ---
  if (horse.raceCount === 0) {
    parts.push('lần đầu thi đấu, chưa có dữ liệu lịch sử');
  } else if (winRate === 100) {
    parts.push(`bất bại ${horse.winCount}/${horse.raceCount} race`);
  } else if (winRate >= 70) {
    parts.push(`win rate xuất sắc ${winRate}% (${horse.winCount}/${horse.raceCount} race)`);
  } else if (winRate >= 50) {
    parts.push(`win rate tốt ${winRate}%`);
  } else if (winRate >= fieldStats.avgWinRate) {
    parts.push(`win rate ${winRate}% trên mức trung bình field`);
  } else if (winRate > 0) {
    parts.push(`win rate thấp ${winRate}%, phong độ chưa ổn định`);
  } else {
    parts.push(`chưa giành chiến thắng sau ${horse.raceCount} lần thi đấu`);
  }

  // --- Điểm/Grade nổi bật ---
  if (horse.currentGrade === 'G1') {
    parts.push('đẳng cấp G1 cao nhất');
  } else if (horse.totalPoints >= fieldStats.maxPoints * 0.9 && horse.totalPoints > 0) {
    parts.push(`điểm tích lũy dẫn đầu (${horse.totalPoints} điểm)`);
  } else if (horse.totalPoints >= fieldStats.avgPoints * 1.5 && horse.totalPoints > 0) {
    parts.push(`điểm tích lũy vượt trội (${horse.totalPoints} điểm)`);
  }

  // --- Đánh giá kỵ sĩ ---
  if (!jp || (jp.raceCount === 0 && jp.experienceYears === 0)) {
    parts.push('chưa có kỵ sĩ phân công');
  } else if (jWinRate >= 40 && jp.raceCount >= 10) {
    parts.push(`kỵ sĩ đỉnh cao: ${jWinRate}% win rate, ${jp.experienceYears} năm KN`);
  } else if (jWinRate >= 25) {
    parts.push(`kỵ sĩ ${jp.experienceYears} năm kinh nghiệm, win rate ${jWinRate}%`);
  } else if (jp.experienceYears >= 8) {
    parts.push(`kỵ sĩ lão luyện ${jp.experienceYears} năm kinh nghiệm`);
  } else if (jp.experienceYears > 0) {
    parts.push(`kỵ sĩ ${jp.experienceYears} năm kinh nghiệm`);
  }

  // Ghép tối đa 2 yếu tố nổi bật nhất
  return parts.slice(0, 2).join('; ');
}

// Fallback predictions when Gemini is unavailable
function buildFallbackPredictions(horses) {
  const scores = horses.map((h) => calcScore(h.horse, h.jockey));
  const winProbs = softmax(scores, AI_CONFIG.winProbability.softmaxBeta);
  const top3Probs = softmax(scores, 2);

  // Tính thống kê toàn field để so sánh tương đối
  const allWinRates = horses.map((h) =>
    h.horse.raceCount > 0 ? (h.horse.winCount / h.horse.raceCount) * 100 : 0,
  );
  const allPoints = horses.map((h) => h.horse.totalPoints);
  const fieldStats = {
    avgWinRate: allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length,
    avgPoints: allPoints.reduce((a, b) => a + b, 0) / allPoints.length,
    maxPoints: Math.max(...allPoints),
  };

  const ranked = horses
    .map((h, i) => ({
      rank: 0,
      horseId: h.horse._id,
      horseName: h.horse.name,
      winProbability: Math.round(winProbs[i] * 100),
      top3Probability: Math.min(Math.round(top3Probs[i] * 100 * 2.5), 95),
      _score: scores[i],
      _horse: h.horse,
      _jockey: h.jockey,
    }))
    .sort((a, b) => b.winProbability - a.winProbability)
    .map((p, i) => ({
      rank: i + 1,
      horseId: p.horseId,
      horseName: p.horseName,
      winProbability: p.winProbability,
      top3Probability: p.top3Probability,
      reason: buildReasonFromStats(p._horse, p._jockey, i + 1, fieldStats),
    }));

  return ranked;
}

async function generateWithGemini(race, horses) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const horseData = horses.map((h) => {
    const jp = h.jockey?.jockeyProfile;
    const winRate = h.horse.raceCount > 0
      ? Math.round((h.horse.winCount / h.horse.raceCount) * 100) : 0;
    const jWinRate = jp?.raceCount > 0
      ? Math.round((jp.winCount / jp.raceCount) * 100) : 0;
    return {
      horseId: h.horse._id.toString(),
      name: h.horse.name,
      grade: h.horse.currentGrade,
      winRate: `${winRate}% (${h.horse.winCount}/${h.horse.raceCount} races)`,
      totalPoints: h.horse.totalPoints,
      totalEarnings: h.horse.totalEarnings,
      weight: h.horse.weight ?? null,
      jockey: jp ? {
        name: h.jockey.fullName,
        experienceYears: jp.experienceYears,
        winRate: `${jWinRate}% (${jp.winCount}/${jp.raceCount} races)`,
      } : null,
    };
  });

  // Tính thống kê field để Gemini có ngữ cảnh so sánh
  const avgWinRate = Math.round(
    horses.reduce((s, h) => s + (h.horse.raceCount > 0 ? h.horse.winCount / h.horse.raceCount : 0), 0)
    / horses.length * 100,
  );
  const maxPoints = Math.max(...horses.map((h) => h.horse.totalPoints));

  const prompt = `Bạn là chuyên gia phân tích đua ngựa chuyên nghiệp với nhiều năm kinh nghiệm.
Hãy phân tích TOÀN DIỆN các yếu tố và đưa ra dự đoán thứ hạng cho cuộc đua sau.

=== THÔNG TIN CUỘC ĐUA ===
Tên: ${race.name}
Cấp hạng: ${race.grade}
Cự ly: ${race.distance}m
Số ngựa tham gia: ${horses.length}
Win rate trung bình field: ${avgWinRate}%
Điểm tích lũy cao nhất field: ${maxPoints} điểm

=== DANH SÁCH NGỰA THAM GIA ===
${JSON.stringify(horseData, null, 2)}

=== YÊU CẦU PHÂN TÍCH ===
Xét các yếu tố theo trọng số:
1. Win rate của ngựa (40%) — quan trọng nhất
2. Điểm tích lũy & grade (35%) — thể hiện đẳng cấp
3. Kinh nghiệm và win rate kỵ sĩ (25%) — ảnh hưởng đáng kể

Lưu ý:
- Ngựa có winRate cao + kỵ sĩ giỏi → ứng viên hàng đầu
- Ngựa mới (0 races) → unpredictable, thường xếp giữa/cuối
- Kỵ sĩ null → bất lợi so với ngựa có kỵ sĩ kinh nghiệm
- Grade cao hơn race grade → lợi thế rõ ràng
- So sánh với win rate trung bình field (${avgWinRate}%) để đánh giá tương đối

=== OUTPUT FORMAT ===
Trả về CHÍNH XÁC một JSON array (không có text nào khác, không có markdown code block):
[
  {
    "rank": 1,
    "horseId": "...",
    "horseName": "...",
    "winProbability": 35,
    "top3Probability": 72,
    "reason": "Lý do cụ thể bằng tiếng Việt, tối đa 20 từ"
  }
]

Ràng buộc bắt buộc:
- Sắp xếp theo rank từ 1 đến ${horses.length}
- Tổng winProbability của TẤT CẢ ngựa = đúng 100
- top3Probability > winProbability với mọi ngựa
- top3Probability tối đa 97
- reason: nêu yếu tố QUYẾT ĐỊNH cụ thể (ví dụ: "Win rate 100% bất bại, kỵ sĩ 8 năm kinh nghiệm"), không viết chung chung`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from response (handle markdown code blocks if present)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid Gemini response format');

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty predictions array');

  return parsed.map((p, i) => ({
    rank: p.rank ?? i + 1,
    horseId: p.horseId,
    horseName: p.horseName,
    winProbability: Math.round(Number(p.winProbability) || 0),
    top3Probability: Math.round(Number(p.top3Probability) || 0),
    reason: p.reason || 'Phân tích AI',
  }));
}

async function getPredictions(raceId, forceRefresh = false) {
  const race = await Race.findById(raceId);
  if (!race) throw { status: 404, message: 'Race not found' };

  if (!['open', 'closed', 'pre_check', 'running'].includes(race.status)) {
    throw { status: 400, message: 'Predictions only available before race finishes' };
  }

  // Return cached predictions unless force refresh
  if (!forceRefresh && race.aiPredictions?.generatedAt && race.aiPredictions.predictions?.length > 0) {
    return { predictions: race.aiPredictions.predictions, generatedAt: race.aiPredictions.generatedAt, fromCache: true };
  }

  // Fetch horses for this race
  const registrations = await Registration.find({ raceId, status: 'active' })
    .populate('horseId')
    .populate('jockeyId', 'fullName jockeyProfile');

  if (registrations.length < 2) {
    throw { status: 400, message: 'Chưa có đủ ngựa để dự đoán (cần ít nhất 2 ngựa)' };
  }

  const horses = registrations.map((r) => ({ horse: r.horseId, jockey: r.jockeyId }));

  let predictions;
  try {
    predictions = await generateWithGemini(race, horses);
  } catch (err) {
    console.error('[ai-prediction] Gemini failed, using fallback:', err.message);
    predictions = buildFallbackPredictions(horses);
  }

  // Persist to cache
  await Race.findByIdAndUpdate(raceId, {
    $set: { 'aiPredictions.generatedAt': new Date(), 'aiPredictions.predictions': predictions },
  });

  return { predictions, generatedAt: new Date(), fromCache: false };
}

async function clearPredictionCache(raceId) {
  await Race.findByIdAndUpdate(raceId, {
    $set: { 'aiPredictions.generatedAt': null, 'aiPredictions.predictions': [] },
  });
}

module.exports = { getPredictions, clearPredictionCache };
