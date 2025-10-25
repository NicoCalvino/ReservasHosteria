const path = require("path")
const express = require ("express")
const app = express()
const db = require('../database/models')
const router = express.Router()
const bcryptjs = require('bcryptjs')

const {body} = require('express-validator')

const adminController = require("../controllers/adminController")
const logInDataValidation = [
    body('user_name').notEmpty().withMessage('Completar el usuario'),
    body('password').notEmpty().withMessage('Completar la contraseña'),
    body('login').custom(async (value,{req})=>{
        let user_name = req.body.user_name
        let password = req.body.user_name

        let existente = await db.User.findAll({
            where:{
                user_name:user_name
            }
        })

        if(user_name != "" && password != ""){
            if(existente.length == 0){
                throw new Error ('Nombre de Usuario o Contraseña incorrectos') 
            }else if(!bcryptjs.compareSync(password,existente[0].password)){
                throw new Error ('Nombre de Usuario o Contraseña incorrectos') 
            }
        }
        return true 
    })
]


router.get("/login", adminController.cargaLogIn)
router.post("/login", logInDataValidation, adminController.procesoLogIn)

module.exports=router