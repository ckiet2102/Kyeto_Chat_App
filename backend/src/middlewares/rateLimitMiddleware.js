const loginAttempts = new Map();

// Clean up expired IP records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.firstAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const loginRateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const record = loginAttempts.get(clientIp);

  if (!record) {
    req.rateLimit = {
      recordFailure: () => {
        loginAttempts.set(clientIp, { count: 1, firstAttempt: now });
      },
      clear: () => loginAttempts.delete(clientIp),
    };
    return next();
  }

  if (now - record.firstAttempt > windowMs) {
    // Reset window
    loginAttempts.delete(clientIp);
    req.rateLimit = {
      recordFailure: () => {
        loginAttempts.set(clientIp, { count: 1, firstAttempt: now });
      },
      clear: () => loginAttempts.delete(clientIp),
    };
    return next();
  }

  if (record.count >= maxAttempts) {
    const timeLeft = Math.ceil((windowMs - (now - record.firstAttempt)) / 1000 / 60);
    return res.status(429).json({
      message: `Bạn đã nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${timeLeft} phút.`,
      retryAfterMinutes: timeLeft,
    });
  }

  req.rateLimit = {
    recordFailure: () => {
      record.count += 1;
    },
    clear: () => loginAttempts.delete(clientIp),
  };

  next();
};
