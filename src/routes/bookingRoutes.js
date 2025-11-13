const path = require("path")
const express = require ("express")
const app = express()
const db = require('../database/models')
const func = require('../functions/funciones')
const router = express.Router()
const activeSessionMiddleware = require ("../middlewares/activeSessionMiddleware")

const bookingController = require("../controllers/bookingController")

const {body} = require('express-validator')
//const {query} = require('express-validator')//

const initialValidation = [
    body('habitaciones').custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let cantTrip = Number(req.body.trpvj) || 0
        let cantDblvm = Number(req.body.dblvm) || 0
        let cantDblvj = Number(req.body.dblvj) || 0
        let cantHab4 = Number(req.body.hab4) || 0
        let cantSuite = Number(req.body.suite) || 0

        let cantidades = [cantTrip, cantDblvm, cantDblvj, cantHab4, cantSuite]
        for(const cantidad of cantidades){
            if(cantidad<0){
                throw new Error ('No se pueden elegir cantidades negativas')
                break
            }
        }

        let totalHabitaciones = cantTrip + cantDblvm + cantDblvj + cantHab4 + cantSuite

        let infoTemp = await db.Temp.findByPk(idTemp)

        if(totalHabitaciones > infoTemp.rooms){
            throw new Error ('Se eligieron más habitaciones de las solicitadas') 
        }
        if(totalHabitaciones < infoTemp.rooms){
            throw new Error ('Se eligieron menos habitaciones de las solicitadas') 
        }

        return true
    }),
    body('trpvj').optional().custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let infoTemp = await db.Temp.findByPk(idTemp)

        let cant = Number(req.body.trpvj) || 0

        let roomType = await db.Room_Type.findAll({
            where:{
                short_name:'trpvj'
            }
        })

        let habLibres = await func.disponibilidadTipo(infoTemp.check_in, infoTemp.check_out, roomType[0])

        if(habLibres < cant){
            throw new Error ('No hay ' + cant + ' habitaciones triples disponibles') 
        }

        return true
    }),
    body('dblvm').optional().custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let infoTemp = await db.Temp.findByPk(idTemp)

        let cant = Number(req.body.dblvm) || 0

        let roomType = await db.Room_Type.findAll({
            where:{
                short_name:'dblvm'
            }
        })

        let habLibres = await func.disponibilidadTipo(infoTemp.check_in, infoTemp.check_out, roomType[0])

        if(habLibres < cant){
            throw new Error ('No hay ' + cant + ' habitaciones dobles vista al mar disponibles') 
        }

        return true
    }),
    body('dblvj').optional().custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let infoTemp = await db.Temp.findByPk(idTemp)

        let cant = Number(req.body.dblvj) || 0

        let roomType = await db.Room_Type.findAll({
            where:{
                short_name:'dblvj'
            }
        })

        let habLibres = await func.disponibilidadTipo(infoTemp.check_in, infoTemp.check_out, roomType[0])

        if(habLibres < cant){
            throw new Error ('No hay ' + cant + ' habitaciones dobles vista al jardin disponibles') 
        }

        return true
    }),
    body('hab4').optional().custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let infoTemp = await db.Temp.findByPk(idTemp)

        let cant = Number(req.body.hab4) || 0

        let roomType = await db.Room_Type.findAll({
            where:{
                short_name:'hab4'
            }
        })

        let habLibres = await func.disponibilidadTipo(infoTemp.check_in, infoTemp.check_out, roomType[0])

        if(habLibres < cant){
            throw new Error ('No hay ' + cant + ' habitaciones de 4 personas disponibles') 
        }

        return true
    }),
    body('suite').optional().custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let infoTemp = await db.Temp.findByPk(idTemp)

        let cant = Number(req.body.suite) || 0

        let roomType = await db.Room_Type.findAll({
            where:{
                short_name:'suite'
            }
        })

        let habLibres = await func.disponibilidadTipo(infoTemp.check_in, infoTemp.check_out, roomType[0])

        if(habLibres < cant){
            throw new Error ('No hay ' + cant + ' suites disponibles') 
        }

        return true
    })
]

let roomSelectionValidation = []
let tiposHabitacion = ["trpvj","dblvm","dblvj","hab4","suite"]
for(let i = 0 ; i < 13 ; i++){
    tiposHabitacion.forEach(tipo =>{
        let validacion = body('mayores' + i + "_" + tipo).optional()
            .custom((value,{req})=>{
                let cantMayores = req.body['mayores' + i + "_" + tipo]
                let cantMenores = req.body['menores' + i + "_" + tipo]

                if(cantMayores == undefined){cantMayores=0}
                if(cantMenores == undefined){cantMenores=0}

                let cantTotal = Number(cantMayores) + Number(cantMenores)
                let capHabitacion
                switch(tipo){
                    case "trpvj":
                        capHabitacion = 3
                        break
                    case "dblvm":
                        capHabitacion = 2
                        break
                    case "dblvj":
                        capHabitacion = 2
                        break
                    case "hab4":
                        capHabitacion = 4
                        break
                    case "suite":
                        capHabitacion = 4
                        break
                    default:
                        capHabitacion = 0
                }

                if(cantTotal == 0){
                    throw new Error ('La habitación no puede quedar vacía') 
                }

                if(cantTotal > capHabitacion){
                    throw new Error ('No se puede superar la capacidad de la habitación') 
                }
                
                return true
            })
        roomSelectionValidation.push(validacion)
    })
}

roomSelectionValidation.push(body('habitaciones').custom(async (value,{req})=>{
        let idTemp = req.session.idTemp
        let initialPeople = await db.Temp.findByPk(idTemp)
        let totalPeople = 0

        for(let i = 0 ; i < 13 ; i++){
            tiposHabitacion.forEach(tipo =>{
                    let cantMayores = req.body['mayores' + i + "_" + tipo]
                    let cantMenores = req.body['menores' + i + "_" + tipo]

                    if(cantMayores == undefined){cantMayores=0}
                    if(cantMenores == undefined){cantMenores=0}

                    let cantTotal = Number(cantMayores) + Number(cantMenores)
                    totalPeople += cantTotal
                })
            }

        if(initialPeople.occupancy < totalPeople){
            throw new Error ('Se asignaron más personas de las reservadas inicialmente')     
        }
        
        if(initialPeople.occupancy > totalPeople){
            throw new Error ('Se asignaron menos personas de las reservadas inicialmente')     
        }

        return true
    })
)

const personalInfoValidation = [
    body('name').notEmpty().withMessage('Completar el nombre'),
    body('lastname').notEmpty().withMessage('Completar el apellido'),
    body('email').notEmpty().withMessage('Completar el mail').custom(async (value,{req})=>{
        let email = req.body.email

        if(email.indexOf("@")==-1){
           throw new Error ('Completar con un mail válido')  
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
    body('phone').notEmpty().withMessage('Completar el teléfono')
]

const duplicatedBookingValidation = [
    body('reserva').custom(async (value,{req})=>{
        let idTemp = req.session.idTemp

        let reservaExistente = await db.Booking.findAll({
            where:{
                temp_id: idTemp
            }
        })

        if(reservaExistente.length > 0){
            throw new Error ('Ya se ha registrado su reserva, si quiere volver a reservar es necesario volver a comenzar el proceso') 
        }
        
        return true
    })   
]

const bookingSearchValidation = [
    body('booking_code').notEmpty().withMessage('Completar el código de reserva'),
    body('email').notEmpty().withMessage('Completar el mail de reserva').custom(async (value,{req})=>{
        let email = req.body.email

        if(email.indexOf("@")==-1){
           throw new Error ('Completar con un mail válido')  
        }

        return true 
    })
]


router.post("/details", activeSessionMiddleware, initialValidation, bookingController.detallesFinales)
router.post("/information", activeSessionMiddleware, duplicatedBookingValidation, roomSelectionValidation, personalInfoValidation, bookingController.generarReservas)
router.get("/confirmed", activeSessionMiddleware, bookingController.reservaConfirmada)
router.get("/search",  bookingController.buscarReserva)
router.post("/search", bookingSearchValidation, bookingController.resultadosReserva)


module.exports=router