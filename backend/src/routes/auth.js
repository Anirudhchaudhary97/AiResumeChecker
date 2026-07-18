const express = require("express");
const { z } = require("zod");

const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { signToken, cookieOptions } = require("../utils/jwt");
const { validate } = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

const User = require("../models/User");

const router = express.Router();


const registerSchema = z.object({
    name: z.string().trim().min(3).max(50),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
});


const profileSchema = z.object({
    name: z.string().trim().min(3).max(50),
  
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
});

const issueSession = async(res,user)=>{

    const token=signToken({
        sub:user._id.toString()
    });
    
    res.cookie(env.cookieName,token,cookieOptions);
    
}

//@desc Register User 
//@route /auth/register
// method POST
router.post("/register",
     authLimiter,
     validate(registerSchema),
     asyncHandler(async(req,res)=>{
         const {name,email,password}=req.body;
         const existingUser = await User.findOne({ email });
         if (existingUser) {
             throw new ApiError.Conflict("Email Already Registered");
         }

         const passwordHash= await User.hashPassword(password);
         const user=await User.create({
            name,
            email,
            passwordHash
         });

         await issueSession(res,user);
         
         res.status(201).json(user);
     })
)



//@desc Login User 
//@route /auth/login
// method POST
router.post("/login",
     authLimiter,
     validate(loginSchema),
     asyncHandler(async(req,res)=>{
        const {email,password}=req.body;
        const user=await User.findOne({ email }).select("+passwordHash");
        if(!user){
            throw new ApiError.NotFound("Invalid Email or Password");
        }
        const isPasswordValid= await user.comparePassword(password);
        if(!isPasswordValid){
            throw new ApiError.Unauthorized("Invalid Email or Password");
        }
        await issueSession(res,user);
        res.status(200).json({user});
     })
)

// @desc Logout User
// @route /auth/logout
// method POST
router.post("/logout",(async(req,res)=>{
    res.clearCookie(env.cookieName, {
        ...cookieOptions,
        maxAge:0
    });
    res.status(200).json({message:"Logout Successful"});
})
)


//@desc Get Current User
//@route /auth/me
//@method GET
router.get("/me",requireAuth,asyncHandler(async(req,res)=>{
    res.status(200).json({user:req.user});
})) 


//profie update 
router.patch("/profile",
    requireAuth,
    validate(profileSchema),
    asyncHandler(async(req,res)=>{
    const {name}=req.body;
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {name},
        {new:true,
         runValidators:true
        }
    );
    res.status(200).json({message:"Profile Updated Successfully",user});
}))


//@desc Change Password
//@route /auth/password
//@method PATCH
router.patch("/password",
    authLimiter,
    requireAuth,
    validate(passwordSchema),
    asyncHandler(async(req,res)=>{
        const {currentPassword,newPassword}=req.body;
        const user=await User.findById(req.user._id).select("+passwordHash");
        if(!user){
            throw new ApiError.NotFound("User Not Found");
        }
        const isPasswordValid= await user.comparePassword(currentPassword);
        if(!isPasswordValid){
            throw new ApiError.Unauthorized("Invalid Password");
        }
        user.passwordHash=await User.hashPassword(newPassword);
        await user.save();
        res.status(200).json({message:"Password Changed Successfully",ok:true});
    })
)


module.exports = router;