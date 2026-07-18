/**
 * Environment Configuration Module
 * Loads environment variables from the .env file and exports them
 * as a structured configuration object. Validates required variables
 * to ensure application stability on startup.
 */
const dotEnv = require("dotenv");
const path = require("path");

// Load .env file from the root of the backend directory
dotEnv.config({ path: path.resolve(__dirname, "../../.env") });

// Define environment variables required for the application to run
const required = ["MONGODB_URI", "JWT_SECRET"];

// Check for missing required variables
const missing = required.filter(key => !process.env[key]); 

if (missing.length) {
    console.error(`Missing required environment variable: ${missing.join(", ")}`);
    process.exit(1);
}

module.exports = {
    // General App Configuration
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    isProduction: process.env.NODE_ENV === "production",

    // Database Configuration
    mongoDbUri: process.env.MONGODB_URI,

    // Authentication & Security Configuration
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7D",
    cookieName: process.env.COOKIE_NAME || "arr_token",

    // Frontend Origin Configuration (Supports multiple origins separated by comma)
    frontendOrigin: (process.env.FRONTEND_ORIGIN)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),

    // AI Integration Configuration (Gemini)
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    // geminiTimeout: parseInt(process.env.GEMINI_TIMEOUT || "10000", 10),
};
