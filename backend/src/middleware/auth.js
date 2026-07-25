const env = require("../config/env");
const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

/**
 * Middleware to enforce authentication on protected routes.
 * Extracts the JWT token from the HTTP-only cookies, verifies its signature and expiration,
 * retrieves the corresponding user from the database, and attaches it to the request object (`req.user`).
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) {
      throw ApiError.unAuthorised();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      throw ApiError.unAuthorised("session expired");
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(ApiError.unAuthorised("Invalid or expired session"));
    }
    next(error);
  }
};

module.exports = requireAuth;
