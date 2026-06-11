import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

// Verify JWT token

const verifyToken = (req,res,next)=>{
    try{
        // get token from header
        const token = req.header('Authorization')?.split(' ')[1];
        if(!token){
            return res.status(401).json({
                error: 'No token, authorization denied'
            })
        }

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId  = decoded.userId;
        req.userRole = decoded.role;
        next();
    }catch(err){
        logger.error(`Jwt verification failed: ${err.message}`);
        res.status(401).json({
            error:'Invalid token'
        });
    }
}

//verify admin role

const verifyAdminRole = (req,res, next) => {
    if(req.userRole !== 'admin'){
        return res.status(403).json({
            error:'Admin access required'
        });
    }
    next();
}

export {verifyAdminRole, verifyToken};