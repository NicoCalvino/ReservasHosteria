const path = require("path")
const express = require ("express")
const app = express()
const router = express.Router()

const errorController = require("../controllers/errorController")

router.get("/session", errorController.sessionError)

module.exports=router