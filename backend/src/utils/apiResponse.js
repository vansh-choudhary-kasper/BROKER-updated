class ApiResponse {
    constructor(success, message, data = null, errors = null) {
        this.success = success;
        this.message = message;
        if (data) this.data = data;
        if (errors) this.errors = errors;
    }

    static success(message, data = null) {
        return new ApiResponse(true, message, data);
    }

    static error(message, errors = null) {
        return new ApiResponse(false, message, null, errors);
    }

    static created(message, data = null) {
        return new ApiResponse(true, message, data);
    }

    static badRequest(message, errors = null) {
        return new ApiResponse(false, message, null, errors);
    }

    static unauthorized(message = 'Unauthorized access') {
        return new ApiResponse(false, message);
    }

    static forbidden(message = 'Forbidden access') {
        return new ApiResponse(false, message);
    }

    static notFound(message = 'Resource not found') {
        return new ApiResponse(false, message);
    }

    static serverError(message = 'Internal server error') {
        return new ApiResponse(false, message);
    }
}

module.exports = ApiResponse; 