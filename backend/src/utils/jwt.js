const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Generate JWT token
const signToken = (payload) => {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn});
};

// Verify JWT token
const verifyToken = (token) => {
    return jwt.verify(token, env.jwtSecret);
};


const cookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 7* 24 * 60 * 60 * 1000, // 7 days,
    path: '/',
};


module.exports = { signToken, verifyToken , cookieOptions};