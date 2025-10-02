const path = require('path')
const express = require('express')
const app = express()

const PORT = process.env.PORT || 3040

const startRoutes = require("./routes/startRoutes")
const resultsRoutes = require("./routes/resultsRoutes")

app.set("view engine","ejs")
app.set("views", path.join(__dirname,"views"))

app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.use("/", startRoutes)
app.use("/consultaReserva", resultsRoutes)

app.listen(PORT,() => console.log("Servidor corriendo en el puerto:" + PORT))