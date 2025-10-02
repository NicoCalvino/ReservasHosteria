const express = require ("express")
const app = express()
const db = require('../database/models')

const router = express.Router()

const resultsController = require("../controllers/resultsController")

const {body} = require('express-validator')
const {query} = require('express-validator')

const searchValidation = [
    query('check_in').notEmpty().withMessage('Completar fecha de Entrada'),
    query('check_out').notEmpty().withMessage('Completar fecha de Salida').custom(async (value,{req})=>{
        let check_in = req.query.check_in
        let check_out = req.query.check_out

        if(check_in > check_out){
           throw new Error ('La fecha de Salida no puede ser anterior a la de entrada')  
        }

        return true
    }),
    query('people').notEmpty().withMessage('Completar la cantidad de Huespedes'),
    query('rooms').notEmpty().withMessage('Completar la cantidad de habitaciones deseadas'),
]

const initialValidation = [
    body('habitaciones').custom(async (value,{req})=>{
        let idTemp = req.params.idTemp
        let cantTrip = Number(req.body.trpvj) || 0
        let cantDblvm = Number(req.body.dblvm) || 0
        let cantDblvj = Number(req.body.dblvj) || 0
        let cantHab4 = Number(req.body.hab4) || 0
        let cantSuite = Number(req.body.suite) || 0

        let totalHabitaciones = cantTrip + cantDblvm + cantDblvj + cantHab4 + cantSuite

        let infoTemp = await db.Temp.findByPk(idTemp)

        if(totalHabitaciones > infoTemp.rooms){
            throw new Error ('Se eligieron más habitaciones de las solicitadas') 
        }
        if(totalHabitaciones < infoTemp.rooms){
            throw new Error ('Se eligieron menos habitaciones de las solicitadas') 
        }

        return true
    })
]

const finalInfoValidation = [
    body('name').notEmpty().withMessage('Completar el nombre'),
    body('lastname').notEmpty().withMessage('Completar el apellido'),
    body('email').notEmpty().withMessage('Completar el mail').custom(async (value,{req})=>{
        let email = req.body.email
        let emailBis = req.body.emailBis

        if(email.indexOf("@")==-1){
           throw new Error ('Completar con un mail valido')  
        }

        return true
    }),
    body('emailBis').notEmpty().withMessage('Repetir el mail').custom(async (value,{req})=>{
        let email = req.body.email
        let emailBis = req.body.emailBis

        if(email != emailBis){
           throw new Error ('Los Mails no coinciden')  
        }

        return true
    }),
    body('phone').notEmpty().withMessage('Completar el telefono')
]

/* 
VALIDACIONES
Si la cantidad de personas supera la cantidad de habitaciones
Si la cantidad de personas supera la ocupacion disponible
Si la fecha de check in es menor a la de check out
*/




router.get("/", searchValidation, resultsController.selectorHabitaciones)
router.post("/detallesReserva/:idTemp", initialValidation, resultsController.detallesFinales)


module.exports=router