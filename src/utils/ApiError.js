
class ApiError extends Error {
     constructor({
        statusCode = 500,
        message = 'Something went wrong',
        errors = [],
        stack = '',
        isOperational = true,
     } = {}) {
        super(message);

        
     }
}


export default ApiError;