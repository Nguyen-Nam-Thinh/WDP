const mongoose = require('mongoose');
const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const cloudinaryService = require('./cloudinary.service');

async function createHorse(ownerId, data) {
  const horse = await Horse.create({ ...data, ownerId });
  return horse;
}

async function getMyHorses(ownerId, { page = 1, limit = 10, isActive, grade } = {}) {
  const filter = { ownerId };
  if (isActive !== undefined) filter.isActive = isActive;
  if (grade) filter.currentGrade = grade;

  const skip = (page - 1) * limit;
  const [horses, total] = await Promise.all([
    Horse.find(filter)
      .populate('regularJockeys', 'fullName email jockeyProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Horse.countDocuments(filter),
  ]);

  return { horses, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getHorseById(horseId, requesterId, requesterRole) {
  const horse = await Horse.findById(horseId).populate(
    'regularJockeys',
    'fullName email jockeyProfile',
  );
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa');

  if (requesterRole !== 'admin' && horse.ownerId.toString() !== requesterId) {
    throw new AppError(403, 'Bạn không có quyền truy cập');
  }

  return horse;
}

async function updateHorse(horseId, ownerId, data) {
  const horse = await Horse.findOne({ _id: horseId, ownerId });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  const IMMUTABLE = [
    'ownerId',
    'totalPoints',
    'totalEarnings',
    'raceCount',
    'winCount',
    'currentGrade',
    'regularJockeys',
    'violations',
  ];
  IMMUTABLE.forEach((field) => delete data[field]);

  Object.assign(horse, data);
  await horse.save();
  return horse;
}

async function deactivateHorse(horseId, ownerId) {
  const horse = await Horse.findOne({ _id: horseId, ownerId });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');
  if (!horse.isActive) throw new AppError(409, 'Ngựa đã được vô hiệu hóa trước đó');

  horse.isActive = false;
  await horse.save();
  return horse;
}

async function addRegularJockey(horseId, ownerId, jockeyId) {
  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  const jockey = await User.findOne({ _id: jockeyId, role: 'jockey', isActive: true });
  if (!jockey) throw new AppError(404, 'Không tìm thấy kỵ sĩ');

  if (horse.regularJockeys.some((id) => id.toString() === jockeyId)) {
    throw new AppError(409, 'Kỵ sĩ đã là kỵ sĩ ruột của ngựa này');
  }

  horse.regularJockeys.push(new mongoose.Types.ObjectId(jockeyId));
  await horse.save();
  return horse.populate('regularJockeys', 'fullName email jockeyProfile');
}

async function removeRegularJockey(horseId, ownerId, jockeyId) {
  const horse = await Horse.findOne({ _id: horseId, ownerId });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  const before = horse.regularJockeys.length;
  horse.regularJockeys = horse.regularJockeys.filter((id) => id.toString() !== jockeyId);
  if (horse.regularJockeys.length === before)
    throw new AppError(404, 'Kỵ sĩ không có trong danh sách kỵ sĩ ruột');

  await horse.save();
  return horse;
}

async function uploadImages(horseId, ownerId, fileBuffers) {
  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  // Upload files to Cloudinary
  const uploadedImages = await cloudinaryService.uploadMultiple(fileBuffers, 'hrtms/horses/images');
  const imageUrls = uploadedImages.map((img) => img.url);

  // Add to imageUrls array
  horse.imageUrls = [...(horse.imageUrls || []), ...imageUrls];

  // Set primary image if not set
  if (!horse.primaryImageUrl && horse.imageUrls.length > 0) {
    horse.primaryImageUrl = horse.imageUrls[0];
  }

  await horse.save();
  return horse;
}

async function setPrimaryImage(horseId, ownerId, imageUrl) {
  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  if (!horse.imageUrls.includes(imageUrl)) {
    throw new AppError(400, 'Không tìm thấy ảnh trong thư viện ngựa');
  }

  horse.primaryImageUrl = imageUrl;
  await horse.save();
  return horse;
}

async function deleteImage(horseId, ownerId, imageUrl) {
  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  const index = horse.imageUrls.indexOf(imageUrl);
  if (index === -1) throw new AppError(404, 'Không tìm thấy ảnh trong thư viện ngựa');

  // Delete from Cloudinary
  const publicId = cloudinaryService.extractPublicId(imageUrl);
  if (publicId) {
    await cloudinaryService.deleteFile(publicId);
  }

  // Remove from array
  horse.imageUrls.splice(index, 1);

  // Reset primary image if deleted
  if (horse.primaryImageUrl === imageUrl) {
    horse.primaryImageUrl = horse.imageUrls.length > 0 ? horse.imageUrls[0] : null;
  }

  await horse.save();
  return horse;
}

module.exports = {
  createHorse,
  getMyHorses,
  getHorseById,
  updateHorse,
  deactivateHorse,
  addRegularJockey,
  removeRegularJockey,
  uploadImages,
  setPrimaryImage,
  deleteImage,
};
