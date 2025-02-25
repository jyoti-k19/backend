import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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

     const {fullName , email , username , password} = req.body
     console.log("email : " , email );

     if (
           [fullName, email , username, password].some((feild) => feild?.trim() === "")
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
            fullName,
            avatar : avatar?.url || "", 
            coverImage : coverImage?.url || "" ,
            email,
            password,
            username : username.toLowerCase()
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


export {
      registerUser,
}