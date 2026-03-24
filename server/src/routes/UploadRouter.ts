import { Router } from 'express';
import { presignComplaintImageUpload } from '../utils/s3.js';

const uploadRouter = Router();

// Returns a presigned S3 PUT URL for uploading a complaint photo.
// Client flow:
// 1) POST /uploads/presign -> { uploadUrl, publicUrl }
// 2) PUT file bytes to uploadUrl (Content-Type must match)
// 3) Send publicUrl as complaint_proof when creating the complaint
uploadRouter.post('/presign', async (req, res) => {
  try {
    const { filename, contentType, uuid, folder } = req.body || {};

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename and contentType are required' });
    }

    const result = await presignComplaintImageUpload({
      filename: String(filename),
      contentType: String(contentType),
      uuid: uuid ? String(uuid) : undefined,
      folder: folder ? String(folder) : undefined,
    });

    return res.status(200).json(result);
  } catch (e: any) {
    const message = e?.message || 'Failed to create presigned URL';
    return res.status(400).json({ message });
  }
});

export default uploadRouter;
