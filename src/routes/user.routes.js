import { Router } from " express " ;
import {registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlerware.js";
const router = Router()
//middleware
router.route("/register").post(upload.fields([
      {
            nmae: "avatar",
            maxCount : 1
      },
      {
            name: "coverImage",
            maxCount : 1 ,

      }
]),
registerUser,
)

// export default router
