import multer from "multer" //cb callback

const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./public/temp")
      },
      filename: function (req, file, cb) {
      
        cb(null, file.originalname)
      }
    })
    
    export const upload = multer({ 
      storage,
 })