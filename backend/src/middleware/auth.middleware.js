const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'No token provided');
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { _id: payload.userId, role: payload.role, email: payload.email, isActive: true };
    next();
  } catch {
    sendError(res, 401, 'Invalid or expired token');
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 403, 'Insufficient permissions');
      return;
    }
    next();
  };
}

// Không bắt buộc token — set req.user nếu có, tiếp tục nếu không
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyAccessToken(token);
      req.user = { _id: payload.userId, role: payload.role, email: payload.email, isActive: true };
    } catch {
      // token invalid/expired — bỏ qua, tiếp tục như guest
    }
  }
  next();
}

module.exports = { authenticate, authorize, optionalAuthenticate };
