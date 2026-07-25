const { rateLimit } = require("express-rate-limit");

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?._id?.toString() || req.ip;
    return `${userId}`;
  },
  message: {
    error: {
      message: "Too many requests. Please try again later.",
    },
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: {
    error: {
      message: "Too many requests. Please try again later.",
    },
  },
});

module.exports = { analyzeLimiter, authLimiter };
