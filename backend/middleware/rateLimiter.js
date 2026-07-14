const rateLimits = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window
  const max = options.max || 100; // limit each IP to 100 requests per windowMs

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, {
        resetTime: now + windowMs,
        count: 1
      });
      return next();
    }

    const rate = rateLimits.get(ip);

    if (now > rate.resetTime) {
      // Window expired, reset
      rate.resetTime = now + windowMs;
      rate.count = 1;
      next();
    } else {
      rate.count += 1;
      if (rate.count > max) {
        return res.status(429).json({
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.round((rate.resetTime - now) / 1000)
        });
      }
      next();
    }
  };
};

module.exports = rateLimiter;
