require('dotenv').config(); // đầu tiên

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary, // truyền đúng instance .v2 đã cấu hình
  params: async (req, file) => ({
    folder: 'Check In',
    resource_type: 'auto',
    public_id: file.originalname,
  }),
  allowedFormats: ['jpg', 'png', 'jpeg', 'xlsx', 'xls'],
});

const upload = multer({ storage });


const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    console.log(req.file)
    if (err) {
      console.error('Upload Error:', err);
      return res.status(400).json({
        status: 'error',
        message: 'Lỗi upload ảnh',
        error: err.message,
      });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Không có ảnh' });
    }
    next();
  });
};

module.exports = handleUpload;
