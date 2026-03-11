import { NODE_ENV } from "../../../../config/config.service.js"

export const globalErrorHandling = (error, req, res, next) => {
    const status = error.cause?.status ?? 500
    return res.status(status).json({
        error_message:
            status == 500 ? 'something went wrong' : error.message ?? 'something went wrong',
        stack: NODE_ENV == "development" ? error.stack : undefined
    })
}

export const ErrorException = ({ message = "Fail", status = 400 }) => {
    throw new Error(message, { cause: { status, extra } });
}

export const ConflictException = ({ message = "Conflict", status = 400 }) => {
    return ErrorException({ message, status: 409, extra });
}

export const NotFoundException = ({ message = "NotFound", status = 400 }) => {
    return ErrorException({ message, status: 404, extra });
}