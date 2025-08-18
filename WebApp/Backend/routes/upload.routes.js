const express = require('express');
const router = express.Router();
const handleUpload = require('../utils/uploadImage');

router.get('/', handleUpload.getPresignedUrl);

module.exports = router;
