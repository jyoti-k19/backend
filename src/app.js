import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()  //creating app using method

app.use(cors( {
      origin: process.env.CORS_ORIGIN,
      credentials: true
}))

app.use(express.jsom({limit: "16kb"}))
app.use(express.urlencoded({extended: true ,limit : "16kb"}))
app.use(express.static("public"))
app.use(cookiePraiser())


//import routes

import userRouter from './routes/user.routes.js'


//routes declaration using middlerware we cant do get directly like we did previously
app.use("/api/v1/user" , userRouter)

export { app }