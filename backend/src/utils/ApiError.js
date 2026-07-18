class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        details,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad Request", details) {
        return new ApiError(400, message, details);
    }

    static unAuthorised(message = "Unauthorized", details) {
        return new ApiError(401, message, details);
    }
    static notFound(message = "Not Found", details) {
        return new ApiError(404, message, details);
    }
    static internalServerError(message = "Internal Server Error", details) {
        return new ApiError(500, message, details);
    }

    static conflict(message = "Conflict", details) {
        return new ApiError(409, message, details);
    }

    static tooManyRequests(message = "Too Many Requests", details) {
        return new ApiError(429, message, details);
    }

    static unprocessableEntity(message = "Unprocessable Entity", details) {
        return new ApiError(422, message, details);
    }
}

module.exports = ApiError;