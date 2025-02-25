import dotenv from "dotenv"
import connectDB from "./db/indi.js";
import app from "./app.js";
// import express from "express";

dotenv.config({
      path: './env'
})

connectDB()
.then(() => {
      app.listen(process.env.PORT || 8000 , () => {
            console.log(`Server is running at port : $ {process.env.PORT}`);
      })
})
.catch((err) => {
      console.log("MONGO db connection failed !!! " , err);

})