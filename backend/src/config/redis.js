const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient = null;
let isRedisConnected = false;

export const initRedis = async () => {
  try {
    const { createClient } = await import("redis");
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    });

    redisClient.on("error", () => {
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("✅ Kết nối Redis Server thành công!");
      isRedisConnected = true;
    });

    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis connection timeout")), 1500)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    return redisClient;
  } catch (error) {
    console.warn("⚠️ Redis Server không có sẵn. Chạy chế độ MongoDB trực tiếp (Direct DB).");
    isRedisConnected = false;
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (e) {}
    }
    redisClient = null;
    return null;
  }
};

export const getCachedData = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const setCachedData = async (key, value, ttlSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    // Ignore cache write errors
  }
};

export const delCachedData = async (key) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    // Ignore cache delete errors
  }
};

export { redisClient, isRedisConnected };
