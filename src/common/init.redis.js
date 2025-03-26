const redis = require('redis');

// Tạo client Redis
const client = redis.createClient({
  url: 'redis://default:FAR3Kd89miDMyH88bJvSS63TNJC4klY5@redis-14584.c280.us-central1-2.gce.redns.redis-cloud.com:14584', // URL mặc định của Redis
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Kết nối đến Redis
(async () => {
  await client.connect();
})();

// Hàm thêm token vào blacklist
exports.addToBlacklist = async (token, expiresIn) => {
  await client.set(token, 'blacklisted', { EX: expiresIn });
};

// Hàm kiểm tra token có trong blacklist không
exports.isBlacklisted = async (token) => {
  const result = await client.get(token);
  return result !== null;
};

// Export client để sử dụng ở nơi khác nếu cần
exports.redisClient = client;