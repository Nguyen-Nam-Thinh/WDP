const aiPredictionService = require('../services/ai-prediction.service');

async function getRaceAIPredictions(req, res, next) {
  try {
    const { id: raceId } = req.params;
    const forceRefresh = req.query.refresh === 'true';
    const result = await aiPredictionService.getPredictions(raceId, forceRefresh);
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

module.exports = { getRaceAIPredictions };
