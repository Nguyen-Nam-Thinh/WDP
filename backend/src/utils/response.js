function sendSuccess(res, data, statusCode = 200, message) {
  return res.status(statusCode).json({ success: true, message, data });
}

function sendError(res, statusCode, message, errors) {
  return res.status(statusCode).json({ success: false, message, errors });
}

module.exports = { sendSuccess, sendError };
