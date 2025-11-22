const express = require ("express")
const router = express.Router()

const guestMiddleware = require('../middlewares/guestMiddleware')

const reportsController = require("../controllers/reportsController")

router.get("/reporteOcupacion", guestMiddleware, reportsController.reporteOcupacion)

module.exports=router