import express from "express";
import {registerUser, loginUser} from "../services/authService.js";
import {verifyToken} from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

//Post /api/auth/register

router.post('/register', async(req, res, next)=>{
    try{
        console.log(req.body);
        const { username, email, password, firstname, lastname, phone} = req.body;

        // validation
        if(!username || !email || !password){
            return res.status(400).json({
                error:'Username, email and password are required'
            })
        }

        if(password.length < 8){
            return res.status(400).json({
                error:'Password must be atleast 8 characters'
            })
        }

        // Register user
        const result = await registerUser({
            username,
            email,
            password,
            firstname,
            lastname,
            phone
        })
        return res.status(201).json(result);
    }catch(err){
        // console.log(err);
        next(err);
    }
})

// Post /api/auth/login

router.post('/login', async (req,res,next) =>{
    try{
        const {email, password} = req.body;

        //validation
        if(!email || !password){
            return res.status(400).json({
                error:'Email and password are required'
            })
        }

        // Login user
        const result = await loginUser(email,password);
        res.json(result);
    }catch(err){
        if(err.message.includes('Invalid')) {
            return res.status(401).json({
                error: err.message
            });
        }
        next(err);
    }
})

// Get /api/auth/profile (protected route)
router.get('/profile', verifyToken, async (req,res,next)=>{
    try{
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                error: "User not found"
            })
        }

        res.json({
            success: true,
            user:{
                _id: user.id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt
            }
        })
    }catch(err){
        next(err);
    }
})

export default router;