const express = require ("express")
const router = express.Router()

const errorController = require("../controllers/errorController")

router.get("/session", errorController.sessionError)
router.get("/admin", errorController.adminError)

module.exports=router