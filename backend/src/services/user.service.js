const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const cloudinaryService = require('./cloudinary.service');

async function getUserById(userId) {
  const user = await User.findById(userId).populate('walletId', 'balance');
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function updateProfile(userId, data) {
  const flat = {};
  if (data.fullName !== undefined) flat.fullName = data.fullName;
  if (data.phone !== undefined) flat.phone = data.phone;
  if (data.avatarUrl !== undefined) flat.avatarUrl = data.avatarUrl;

  if (data.jockeyProfile) {
    for (const [k, v] of Object.entries(data.jockeyProfile)) {
      flat[`jockeyProfile.${k}`] = v;
    }
  }
  if (data.refereeProfile) {
    for (const [k, v] of Object.entries(data.refereeProfile)) {
      flat[`refereeProfile.${k}`] = v;
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: flat },
    { new: true, runValidators: false },
  ).populate('walletId', 'balance');
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function uploadAvatar(userId, fileBuffer) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  // Delete old avatar if exists
  if (user.avatarUrl) {
    const oldPublicId = cloudinaryService.extractPublicId(user.avatarUrl);
    if (oldPublicId) {
      await cloudinaryService.deleteFile(oldPublicId);
    }
  }

  // Upload new avatar
  const { url } = await cloudinaryService.uploadSingle(fileBuffer, 'hrtms/users/avatars');
  user.avatarUrl = url;
  await user.save();
  return User.findById(userId).populate('walletId', 'balance');
}

async function getJockeys(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [jockeys, total] = await Promise.all([
    User.find({ role: 'jockey' })
      .select('fullName avatarUrl jockeyProfile isActive')
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({ role: 'jockey' }),
  ]);
  return { jockeys, total, page, limit };
}

module.exports = { getUserById, updateProfile, uploadAvatar, getJockeys };
