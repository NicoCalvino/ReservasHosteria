const path = require('path')
const express = require('express')
const app = express()
const session = require('express-session')
const methodOverride = require("method-override")
const cookie = require('cookie-parser')

const PORT = process.env.PORT || 3040

const searchRoutes = require("./routes/searchRoutes")
const bookingRoutes = require("./routes/bookingRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const errorRoutes = require("./routes/errorRoutes")
const adminRoutes = require("./routes/adminRoutes")
const adminLoggedMiddleware = require("./middlewares/adminLoggedMiddleware")


app.set("view engine","ejs")
app.set("views", path.join(__dirname,"views"))

app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(session({secret:'Esto Es Secreto',resave:false, saveUninitialized:false}))
app.use(methodOverride("_method")) 
app.use(cookie())
app.use(adminLoggedMiddleware)

app.use("/search", searchRoutes)
app.use("/booking", bookingRoutes)
app.use("/payment", paymentRoutes)
app.use("/error", errorRoutes)
app.use("/admin", adminRoutes)

app.listen(PORT,() => console.log("Servidor corriendo en el puerto:" + PORT))