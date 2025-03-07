// import {express} from "express" ;
import { Router } from "express" ;
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";



const router = Router()
//middleware
router.route("/register").post(upload.fields([
      {
            name: "avatar",
            maxCount : 1
      },
      {
            name: "coverImage",
            maxCount : 1 ,

      }
]),
registerUser,
)
                    //post method is used for login user
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router
