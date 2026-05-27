const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');

async function getUserById(userId) {
  const user = await User.findById(userId).populate('walletId', 'balance');
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function updateProfile(userId, data) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true },
  ).populate('walletId', 'balance');
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

module.exports = { getUserById, updateProfile };
