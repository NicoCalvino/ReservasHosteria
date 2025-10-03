const path = require('path')
const express = require('express')
const app = express()
const session = require('express-session')

const PORT = process.env.PORT || 3040

const searchRoutes = require("./routes/searchRoutes")

app.set("view engine","ejs")
app.set("views", path.join(__dirname,"views"))

app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(session({secret:'Esto Es Secreto',resave:false, saveUninitialized:false}))

app.use("/", searchRoutes)

app.listen(PORT,() => console.log("Servidor corriendo en el puerto:" + PORT))