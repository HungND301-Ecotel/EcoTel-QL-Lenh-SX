require("dotenv").config();
const AWS = require("aws-sdk");
const path = require("path"); // để lấy phần mở rộng file

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

// Bản đồ phần mở rộng → content-type
const contentTypes = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  txt: "text/plain",
};

exports.getPresignedUrl = async (req, res) => {
  const { fileName, type } = req.query;

  const prefix = {
    checkin: "checkin/",
    avatar: "avatar/",
    signature: "signature/",
    document: "documents/",
  }[type];

  if (!prefix) {
    return res.status(400).json({ message: "Invalid type" });
  }

  if (!fileName) {
    return res.status(400).json({ message: "Missing fileName" });
  }

  // Lấy phần mở rộng (ext không có dấu chấm)
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const contentType = contentTypes[ext] || "application/octet-stream"; // default binary

  const fileKey = `${prefix}${fileName}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    Expires: 60 * 5, // URL sống 5 phút
  };

  try {
    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    res.json({
      status: "success",
      data: {
        uploadUrl: uploadURL,
        fileKey: fileKey,
      },
    });
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    res.status(500).json({ status: "error", message: "Error generating URL" });
  }
};

exports.getDownloadUrl = async (req, res) => {
  try {
    const { key } = req.query; // FE gửi key = "checkin/abc.webp"
    if (!key) return res.status(400).json({ message: "Missing key" });

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Expires: 60 * 30, // 5 phút
    };

    const downloadURL = await s3.getSignedUrlPromise("getObject", params);
    res.json({
      status: "success",
      data: downloadURL,
    });
  } catch (err) {
    console.error("Error generating download URL:", err);
    res.status(500).json({ message: "Error generating URL" });
  }
};
