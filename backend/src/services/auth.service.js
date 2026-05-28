const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const { createWallet } = require('./wallet.service');
const { signAccessToken, signRefreshToken, verifyRefreshToken, signResetToken, verifyResetToken } = require('../utils/jwt');
const { sendResetCodeEmail } = require('../config/email');
const { AppError } = require('../middleware/error.middleware');

const SALT_ROUNDS = 12;

async function register(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError(409, 'Email already registered');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const [user] = await User.create(
      [{ email: data.email, passwordHash, fullName: data.fullName, phone: data.phone, role: data.role }],
      { session },
    );

    const wallet = await createWallet(user._id, session);
    user.walletId = wallet._id;
    await user.save({ session });

    await session.commitTransaction();

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role, email: user.email });
    const refreshToken = signRefreshToken(user._id);

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHash });

    return {
      accessToken,
      refreshToken,
      user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash +refreshToken');
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role, email: user.email });
  const refreshToken = signRefreshToken(user._id);

  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: refreshHash });

  return {
    accessToken,
    refreshToken,
    user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role },
  };
}

async function refreshTokens(token) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || !user.refreshToken) throw new AppError(401, 'Invalid refresh token');

  const valid = await bcrypt.compare(token, user.refreshToken);
  if (!valid) throw new AppError(401, 'Invalid refresh token');

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role, email: user.email });
  const newRefreshToken = signRefreshToken(user._id);

  const refreshHash = await bcrypt.hash(newRefreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: refreshHash });

  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  // Không tiết lộ email có tồn tại hay không
  if (!user || !user.isActive) return;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  await User.findByIdAndUpdate(user._id, {
    passwordResetCode: codeHash,
    passwordResetExpires: expires,
  });

  await sendResetCodeEmail(email, code);
}

async function verifyResetCode(email, code) {
  const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetExpires');
  if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
    throw new AppError(400, 'Invalid or expired reset code');
  }

  if (user.passwordResetExpires < new Date()) {
    throw new AppError(400, 'Reset code has expired');
  }

  const valid = await bcrypt.compare(code, user.passwordResetCode);
  if (!valid) throw new AppError(400, 'Invalid reset code');

  // Xóa OTP sau khi verify thành công
  await User.findByIdAndUpdate(user._id, {
    passwordResetCode: null,
    passwordResetExpires: null,
  });

  const resetToken = signResetToken(user._id);
  return { resetToken };
}

async function resetPassword(resetToken, newPassword) {
  let payload;
  try {
    payload = verifyResetToken(resetToken);
  } catch {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.findByIdAndUpdate(payload.userId, {
    passwordHash,
    refreshToken: null, // invalidate tất cả session hiện tại
  });
}

module.exports = { register, login, refreshTokens, logout, forgotPassword, verifyResetCode, resetPassword };
