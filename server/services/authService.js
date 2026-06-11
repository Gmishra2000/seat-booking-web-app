import jwt from "jsonwebtoken";
import User from '../models/User.js';
import logger from "../config/logger.js";

// generate jwt token

const generateToken = (userId, role) =>{
    return jwt.sign(
        {userId, role},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRE}
    );
};

// register new user
const registerUser = async (userData) =>{
    try{
        // check if user already exists
        const existingUser = await User.findOne({
            $or: [
                {email: userData.email},
                {username: userData.username}
            ]
        });
        if(existingUser){
            const field = existingUser.email === userData.email? 'Email': 'Username';
            const error = new Error(`${field} already exists`);
            error.status = 400;
            throw error;
        }

        // crate new user
        const user = new User(userData);
        await user.save();

        logger.info(`User registered: ${user.email}`);

        // Generate token
        const token = generateToken(user._id, user.role);
        return {
            success: true,
            token,
            user:{
                _id: user._id,
                username:user.username,
                email: user.email,
                role: user.role
            }
        }
    }catch(err){
        logger.error(`Registration error:${err.message}`);
        throw err;
    }
}

// login user

const loginUser = async(email,password) => {
    try{
        // Find user and include password

        const user = await User.findOne({
            email
        }).select('+password');

        if(!user){
            throw new Error('Invalid email or password');
        }

        //compare password
        const isPasswordValid = await user.comparePassword(password);

        if(!isPasswordValid){
            throw new Error('Invalid password');
        }

        logger.info(`User logged in: ${user.email}`);

        // Generate token
        const token = generateToken(user._id, user.role);

        return{
            success: true,
            token,
            user:{
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };
    }catch(err){
        logger.error(`Login error: ${err.message}`);
        throw err;
    }
}

export { registerUser, loginUser, generateToken };