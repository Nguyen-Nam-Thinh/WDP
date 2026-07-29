const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const { createWallet } = require('./wallet.service');
const { AppError } = require('../middleware/error.middleware');
const cloudinaryService = require('./cloudinary.service');

const SALT_ROUNDS = 12;

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

async function getReferees(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({ role: 'referee', isActive: true })
      .select('fullName email avatarUrl refereeProfile isActive')
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({ role: 'referee', isActive: true }),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getUsers(page = 1, limit = 20, role) {
  const filter = {};
  if (role) filter.role = role;
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('fullName email avatarUrl role isActive jockeyProfile refereeProfile createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function toggleActive(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  user.isActive = !user.isActive;
  await user.save();
  return user;
}

async function adminUpdateUser(userId, data) {
  const allowed = ['fullName', 'phone', 'role', 'isActive'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function adminCreateUser({
  email, password, fullName, phone, role,
  licenseNumber, yearsOfService = 0,
  weight, height, experienceYears = 0, bio,
}) {
  const allowedRoles = ['owner', 'jockey', 'referee', 'spectator'];
  if (!allowedRoles.includes(role)) {
    throw new AppError(400, 'Role không hợp lệ. Chỉ được tạo owner, jockey, referee, spectator');
  }

  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, 'Email đã được đăng ký');

  const userData = {
    email,
    passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    fullName,
    phone,
    role,
  };

  if (role === 'referee') {
    if (!licenseNumber?.trim()) throw new AppError(400, 'Vui lòng nhập số giấy phép trọng tài');
    userData.refereeProfile = {
      licenseNumber: licenseNumber.trim(),
      yearsOfService: Number(yearsOfService) || 0,
    };
  }

  if (role === 'jockey') {
    const w = Number(weight);
    const h = Number(height);
    if (!w || w <= 0) throw new AppError(400, 'Vui lòng nhập cân nặng hợp lệ cho kỵ thủ');
    if (!h || h <= 0) throw new AppError(400, 'Vui lòng nhập chiều cao hợp lệ cho kỵ thủ');
    userData.jockeyProfile = {
      weight: w,
      height: h,
      experienceYears: Number(experienceYears) || 0,
      bio: bio || undefined,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [user] = await User.create([userData], { session });
    const wallet = await createWallet(user._id, session);
    user.walletId = wallet._id;
    await user.save({ session });
    await session.commitTransaction();

    return User.findById(user._id).select(
      'fullName email phone avatarUrl role isActive jockeyProfile refereeProfile createdAt',
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/** @deprecated use adminCreateUser */
async function adminCreateReferee(data) {
  return adminCreateUser({ ...data, role: 'referee' });
}

module.exports = {
  getUserById, updateProfile, uploadAvatar, getJockeys, getReferees,
  getUsers, toggleActive, adminUpdateUser, adminCreateUser, adminCreateReferee,
};
