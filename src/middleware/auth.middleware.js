import {ApiError} from "../utils/ApiError";
import {asyncHandler} from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model";

export const verifyJWT = asyncHandler(async(req, res, next ) => {
    try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "")
      if (!token) {
       throw new ApiError(401, " Unauthorised Access")
      }
      const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
 
      await User.findById(decodedToken?._id).select("-password -refreshToken")
 
      if(!user) {
           //TODO: discuss about frontend
           throw new ApiError(401, "Invalid Access Token")
      }
 
      req.user = user ;
      next() //helps to know user is authenticated or not at multiple places
    } catch (error) {               //if error is there decode the message else give our own msg
          throw new ApiError(401, error?.message || "Invalid access token")
    }

})