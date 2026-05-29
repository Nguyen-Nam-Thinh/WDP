const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201, 'Registration successful');
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user._id.toString());
    sendSuccess(res, null, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    // Luôn trả về success để tránh email enumeration
    sendSuccess(res, null, 200, 'If this email is registered, a reset code has been sent');
  } catch (error) {
    next(error);
  }
}

async function verifyResetCode(req, res, next) {
  try {
    const result = await authService.verifyResetCode(req.body.email, req.body.code);
    sendSuccess(res, result, 200, 'Code verified');
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.resetToken, req.body.newPassword);
    sendSuccess(res, null, 200, 'Password reset successful');
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user._id.toString(), req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, null, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, logout, forgotPassword, verifyResetCode, resetPassword, changePassword };
