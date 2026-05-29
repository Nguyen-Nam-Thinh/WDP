# Image Upload API Documentation

## Overview

Hệ thống upload ảnh sử dụng Cloudinary cho user avatars và horse gallery.

## Backend Setup

### 1. Environment Variables (`.env`)

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here (optional)
```

### 2. File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── cloudinary.service.js       # Cloudinary upload logic
│   ├── middleware/
│   │   └── upload.middleware.js        # Multer configuration
│   ├── controllers/
│   │   ├── user.controller.js          # +uploadAvatar
│   │   └── horse.controller.js         # +uploadImages, setPrimaryImage, deleteImage
│   ├── services/
│   │   ├── user.service.js             # +uploadAvatar
│   │   └── horse.service.js            # +uploadImages, setPrimaryImage, deleteImage
│   └── routes/
│       ├── user.routes.js              # POST /users/me/upload-avatar
│       └── horse.routes.js             # POST, PATCH, DELETE /horses/:id/image*
```

## API Endpoints

### User Avatar Upload

**Request:**

```
POST /users/me/upload-avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: form-data
  file: <image_file>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "fullName": "User Name",
    "avatarUrl": "https://res.cloudinary.com/...",
    ...
  }
}
```

---

### Horse Image Upload (Multiple)

**Request:**

```
POST /horses/:horseId/upload-images
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: form-data
  files: [<image_file_1>, <image_file_2>, ...]
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "horse_id",
    "name": "Thunder Strike",
    "primaryImageUrl": "https://res.cloudinary.com/.../image1.jpg",
    "imageUrls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg",
      "https://res.cloudinary.com/.../image3.jpg"
    ],
    ...
  }
}
```

---

### Set Primary Image

**Request:**

```
PATCH /horses/:horseId/primary-image
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "imageUrl": "https://res.cloudinary.com/.../image2.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "primaryImageUrl": "https://res.cloudinary.com/.../image2.jpg",
    ...
  }
}
```

---

### Delete Image

**Request:**

```
DELETE /horses/:horseId/image
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "imageUrl": "https://res.cloudinary.com/.../image2.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "imageUrls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image3.jpg"
    ],
    "primaryImageUrl": "https://res.cloudinary.com/.../image1.jpg",
    ...
  }
}
```

---

## Frontend Usage

### Import API Client

```typescript
import { userApi } from '@/app/api/user';
import { horseApi } from '@/app/api/horse';
```

### Upload User Avatar

```typescript
const handleUploadAvatar = async (file: File) => {
  try {
    const user = await userApi.uploadAvatar(token, file);
    console.log('Avatar updated:', user.avatarUrl);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Upload Horse Images

```typescript
const handleUploadImages = async (files: File[]) => {
  try {
    const horse = await horseApi.uploadImages(token, horseId, files);
    console.log('Images uploaded:', horse.imageUrls);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Set Primary Image

```typescript
const handleSetPrimary = async (imageUrl: string) => {
  try {
    const horse = await horseApi.setPrimaryImage(token, horseId, imageUrl);
    console.log('Primary image set:', horse.primaryImageUrl);
  } catch (error) {
    console.error('Failed:', error.message);
  }
};
```

### Delete Image

```typescript
const handleDeleteImage = async (imageUrl: string) => {
  try {
    const horse = await horseApi.deleteImage(token, horseId, imageUrl);
    console.log('Image deleted. Remaining:', horse.imageUrls);
  } catch (error) {
    console.error('Delete failed:', error.message);
  }
};
```

---

## Cloudinary Folder Structure

```
hrtms/
├── users/
│   └── avatars/         # User avatar files
└── horses/
    └── images/          # Horse gallery images
```

---

## Constraints

- **Max file size**: 5MB per file
- **Allowed formats**: JPEG, PNG, WebP, GIF
- **Max horse images**: 10 files per upload
- **Storage**: Auto-deleted old avatar when new one uploaded
- **Primary image reset**: Auto-set to first image if deleted

---

## Error Handling

### Common Errors

| Status | Message                       | Solution                                 |
| ------ | ----------------------------- | ---------------------------------------- |
| 400    | No file provided              | Ensure file is attached                  |
| 400    | Only image files allowed      | Check file format (jpeg, png, webp, gif) |
| 400    | File size must not exceed 5MB | Reduce file size                         |
| 404    | Horse not found               | Check horseId                            |
| 403    | Access denied                 | Only owner can upload                    |
| 401    | Invalid or expired token      | Re-authenticate                          |

---

## Testing with cURL

### Upload Avatar

```bash
curl -X POST http://localhost:5000/users/me/upload-avatar \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/avatar.jpg"
```

### Upload Horse Images

```bash
curl -X POST http://localhost:5000/horses/<horseId>/upload-images \
  -H "Authorization: Bearer <token>" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"
```

---

## Notes

- Cloudinary credentials phải được đặt trong `.env` file
- Old avatars được tự động xoá khỏi Cloudinary
- Primary image reset tự động nếu bị xoá
- Tất cả request phải kèm JWT token trong header `Authorization: Bearer <token>`
