const express = require('express');
const router = express.Router();
const handleUpload = require('../utils/uploadImage');

router.get('/put', handleUpload.getPresignedUrl);
router.get('/get', handleUpload.getDownloadUrl);

module.exports = router;
