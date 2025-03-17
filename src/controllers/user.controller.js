import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefeshTokens = async(userId)=>{
      try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken //storing user data in database
            await user.save({validateBeforeSave: false})

            return { accessToken , refreshToken}

      } catch (error) {
            throw new ApiError(500 , "Something went wrong while genrating refresh and access tokens")
      }
}

const  registerUser = asyncHandler ( async (req , res) => {
     //user data from frontend
     //validation = not empty
     //checking user already exists : username , email
     //create user object = create entry in db
     //check for image check for avatar
     //upload them to cloudinary , avatar
     //remove password and refresh tokens feild from response
     //checking for user creation
     //return res

//      console.log("Received Files:", req.files);

     const {fullname , email , username , password} = req.body

     console.log("email : " , email , "fullname : " , fullname);

     if (
           [fullname, email , username, password].some((feild) => feild?.trim() === "")
     ) {
      throw new ApiError(400, " All feilds are required")
     }

     const existedUser = await User.findOne({
      //using operators
      $or: [{ username } ,{ email }]
     })

     if (existedUser){
            throw new ApiError(409 , "User with email or username already exists")
     }
      // const avatarLocalPath = req.files?.avatar?.[0]?.path || null;
      // const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

      let avatarLocalPath = null;
      if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
            avatarLocalPath = req.files.avatar[0].path
      }

      let coverImageLocalPath = null;
      if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path
      }

      // if(!avatarLocalPath) {
      //       throw new ApiError(400 , "Avatar file is required")
      // }

      const avatar = await uploadOnCloudinary(avatarLocalPath)
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);

      // if(!avatar){
      //       throw new ApiError(400 , "Avatar file is required")

      // }

      const user = await User.create ({
            fullname,
            avatar : avatar?.url || "", 
            coverImage : coverImage?.url || "" ,
            email,
            password,
            username :  username ? username.toLowerCase() : "",
      })

      const createdUser =  await User.findById(user._id).select(
            "-password -refreshToken"
      )

      if(!createdUser){
            throw new ApiError(500 , "Something went wrong while registering the user")
      }

      return res.status(201).json(
            new ApiResponse(200 ,createdUser ,"User registration successful" )
      )

} );

const loginUser = asyncHandler(async (req , res) => {
      // req body =>data
      //username or email
      //find the user
      //password check
      //access and refresh token
      //send secure cookies


      const {email, username , password} = req.body

      if(!username && !email) {
            throw new ApiError(400 , "username or email is required")
      }

      const user = await user.findOne({ //mongoose operations
            $or : [{username} , {email}]
      })

      if(!user) {
            throw new ApiError(404, "user doesn't exist")
      }

      const isPasswordValid = await user.isPasswordCorrect (password)
      if(!isPasswordValid) {
            throw new ApiError(404, "Invalid user credentials")
      }

      const {accessToken , refreshToken} = await generateAccessAndRefeshTokens(user._id)

      const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

      const options = {
            httpOnly : true, //only server can access not frontend
            secure:  true
      }

      return res
      .status(200)
      .cookie("accessToken" , accessToken , options)
      .cookie("refreshToken", refreshToken , options)
      .json(
            200,
            {
                  user: loggedInUser , accessToken , refreshToken //when user triying to save password in their loccal storage
            },
            "User logged In Successfully"
      )
})

const logoutUser = asyncHandler(async(req,res)=> {
      await User.findByIdAndUpdate(
            req.user._id, {
                  $set: {
                        refreshToken: undefined
                  }
            },
            {
                  new: true
            }
      )

      const options = {
            httpOnly : true, //only server can access not frontend
            secure:  true
      }

      return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req , res) =>{
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

      if(!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
      }

      try {
            const decodedToken = jwt.verify(
                  incomingRefreshToken,
                  process.env.REFRESH_TOKEN_SECRET
                  //payload is optional
            )
      
            const user =  User.findById(decodedToken?._id)
      
            if(!user){
                  throw new ApiError(401 , " Invalid refresh token")
            }
      
            if (incomingRefreshToken !== user?.refreshToken){
                  throw new ApiError(401, "Refresh token is expired or used")
            }
               //can be declared globally 
            const options = {
                  httpOnly: true,
                  secure : true
            }
      
            const {accessToken , newRefreshToken} = await generateAccessAndRefeshTokens(user._id)
      
            return res
            .status(200)
            .cookie("accessToken" , options)
            .cookie("refreshToken",newRefreshToken , options)
            .json(
                  new ApiResponse(
                        200,
                        {accessToken, refreshToken : newRefreshToken},
                        "Access token refreshed"
                  )
            )
      } catch (error) {
            throw new ApiError(401 , error?.message || "Invalid refreshToken")
      }


})

const changeCurrentPassword = asyncHandler(async(req,res) => {
      const {oldPassword , newPassword } = req.body

      const user = await User.findById(req.user?.id)
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

      if(!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old password")
      }

      user.password = newPassword
      await user.save ({validateBeforeSave: false})

      return res
      .status(200)
      .json(new ApiResponse(200 , {} , "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req , res)=>{
      return res
      .status(200)
      .json(new ApiResponse( 200, req.user , "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req , res) => {
      const {fullName, email} = req.body 
      //if you're uploading or taking files then keep a seperate controller for that

      if(!fullName || !email) {
            throw new ApiError(400, "All feilds are required")
      }

      const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                  $set: {
                        fullName,
                        email: email
                  }

            },
            {new: true}
      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details update successfully"))

})

//things to keep in mind to update file

const updateUserCoverImage = asyncHandler(async(req, res)=> {
      const coverImageLocalPath = req.files?.path

      if(!coverImageLocalPath) {
            throw new ApiError(400, "Avatar file is missing")
      }

      const avatar = await uploadOnCloudinary
      (avatarLocalPath)

      if(!avatar.url) {
            throw new ApiError(400, "Error while uploading on avatar")
      }

      const updateUserCoverImage = await user.findByIdAndUpdate(
            req.user?._id,
            {
                  $set:{
                        avatar: avatar.url
                  }
            },
            {new: true}
      ).select("-password")

      return res
      .status(200)
      .json(
            new ApiResponse(200, user, "Coverimage update ")

      )

})

export {
      registerUser,
      loginUser,
      logoutUser,
      refreshAccessToken,
      getCurrentUser,
      updateAccountDetails,
      updateUserCoverI
}