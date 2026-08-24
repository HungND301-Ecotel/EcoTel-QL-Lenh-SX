const express = require("express");
const router = express.Router();
const handleUpload = require("../utils/handleUpload");
const { verifyToken } = require("../middleware/auth.middleware");

router.get('/put', verifyToken, handleUpload.getPresignedUrl);
router.get('/get', verifyToken, handleUpload.getDownloadUrl);

module.exports = router;