const path = require("path")
const express = require ("express")
const app = express()
const db = require('../database/models')
const router = express.Router()
const func = require("../functions/funciones")

const guestMiddleware = require('../middlewares/guestMiddleware')

const reportsController = require("../controllers/reportsController")

router.get("/reporteOcupacion", guestMiddleware, reportsController.reporteOcupacion)

module.exports=router