import logger from '../config/logger.js';

const errorHandler =(err, req, res, next)=>{
    logger.error(err.message);

    // Default error
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific mongodb errors
    if(err.code === 11000){
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} already exists`;
    }

    if(err.name === 'ValidationError'){
        statusCode = 400;
        message = Object.values(err.errors).map((e)=> e.message).join(', ');
    }
    res.status(statusCode).json({
        error:message
    });
};

export default errorHandler;