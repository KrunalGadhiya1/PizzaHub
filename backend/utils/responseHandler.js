// Success response
export const successResponse = (res, message, statusCode = 200, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    })
}

// Error response
export const errorResponse = (res, message, statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    })
}