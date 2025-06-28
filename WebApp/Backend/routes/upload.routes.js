const express = require('express');
const router = express.Router();
const handleUpload = require('../utils/uploadImage');

router.post('/', handleUpload, (req, res) => {

    res.status(200).json({
        status: 'success',
        message: 'Upload thành công',
        data: {
            url: req.file?.path,
            public_id: req.file?.filename,
        },
    });
});

module.exports = router;
