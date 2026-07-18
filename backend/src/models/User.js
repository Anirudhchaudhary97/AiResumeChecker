const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')


/**
 * User Schema definition containing personal details, credentials, and metadata.
 */
const userSchema = new mongoose.Schema(
    {
    name: {
        type: String,
        required: true,
        maxlength: 50,
        minlength: 3,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, "Please enter a valid email address"],
        index: true,
    },
    passwordHash: {
        type: String,
        required: [true, "Password is required"],
        select: false
    },
}, { timestamps: true })

/**
 * Hashes a plain text password using bcrypt with a salt round of 12.
 * 
 * @param {string} password - The plain text password to be hashed.
 * @returns {Promise<string>} The hashed password.
 */
userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 12);
}

/**
 * Compares a plain text password with the user's stored password hash.
 * 
 * @param {string} password - The plain text password to check.
 * @returns {Promise<boolean>} Resolves to true if the passwords match, otherwise false.
 */
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
}

/**
 * Customizes the JSON serialization of the user document.
 * Removes sensitive and internal properties (like passwordHash and __v) 
 * so they are not exposed in API responses.
 * 
 * @returns {Object} The sanitized user object.
 */
userSchema.methods.toJSON = function () {
    const obj = this.toObject()
    delete obj.passwordHash
    delete obj.__v
    return obj
}

module.exports = mongoose.model('User', userSchema)