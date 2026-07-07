const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// Khởi tạo Jwks Client để fetch public keys từ Portal
const client = jwksClient({
  jwksUri:
    process.env.PORTAL_JWKS_URI ||
    "http://localhost:1188/.well-known/jwks.json",
  cache: true, // Cache signing keys để tránh fetch liên tục cho mỗi request
  rateLimit: true, // Giới hạn tần suất request lên JWKS endpoint
  jwksRequestsPerMinute: 10,
});
console.log("PORTAL_JWKS_URI:", process.env.PORTAL_JWKS_URI);
/**
 * Hàm lấy public key phù hợp từ kid (Key ID) trong JWT header
 */
function getKey(header, callback) {
  if (!header || !header.kid) {
    return callback(new Error("JWT header is missing or does not contain kid"));
  }

  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Xác thực token của Portal sử dụng JWKS public key
 * @param {string} token - Bearer JWT token từ client
 * @returns {Promise<object>} - Payload đã decode nếu verify thành công
 */
const verifyPortalToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  verifyPortalToken,
};
