const express = require ("express")
const router = express.Router()

const mainController = require("../controllers/mainController")

router.get("/", mainController.start)
router.get("/change-lang/:lang", mainController.languageChange)

module.exports=router