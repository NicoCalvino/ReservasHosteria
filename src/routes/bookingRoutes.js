const express = require ("express")
const db = require('../database/models')
const func = require('../functions/funciones')
const router = express.Router()
const activeSessionMiddleware = require ("../middlewares/activeSessionMiddleware")
const app = express()

const bookingController = require("../controllers/bookingController")

const {body} = require('express-validator')
const {query} = require('express-validator')

const searchValidation = [
    query('check_in').notEmpty().withMessage((value, { req }) => req.__('errores.fecha_de_entrada_vacia')).custom((value,{req})=>{
        let check_in = req.query.check_in
        let fechaHoy = new Date

        if(fechaHoy > func.formateoFecha(check_in)){
           throw new Error (req.__('errores.fecha_de_entrada_invalida'))  
        }

        return true
    }),
    query('check_out').notEmpty().withMessage((value, { req }) => req.__('errores.fecha_de_salida_vacia')).custom((value,{req})=>{
        let check_in = req.query.check_in
        let check_out = req.query.check_out

        if(check_in >= check_out){
           throw new Error (req.__('errores.fecha_de_salida_invalida'))  
        }

        return true
    }),
    query('people').notEmpty().withMessage((value, { req }) => req.__('errores.cantidad_huespedes')).custom((value,{req})=>{
        let cantidad = req.query.people

        if(cantidad <= 0){
           throw new Error (req.__('errores.huespedes_cero'))  
        }

        return true
    }),
    query('rooms').notEmpty().withMessage((value, { req }) => req.__('errores.cantidad_habitaciones')).custom((value,{req})=>{
        let cantidad = Number(req.query.rooms)
        let huespedes = Number(req.query.people)

        if(cantidad <= 0){
           throw new Error (req.__('errores.habitaciones_cero'))  
        }
        
        if(cantidad > huespedes){
           throw new Error (req.__('errores.habitaciones_invalidas'))  
        }

        return true
    }),
]

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
                throw new Error (req.__('errores.cantidades_negativas'))
                break
            }
        }

        let totalHabitaciones = cantTrip + cantDblvm + cantDblvj + cantHab4 + cantSuite

        let infoTemp = await db.Temp.findByPk(idTemp)

        if(totalHabitaciones > infoTemp.rooms){
            throw new Error (req.__('errores.habitaciones_de_mas')) 
        }
        if(totalHabitaciones < infoTemp.rooms){
            throw new Error (req.__('errores.habitaciones_de_menos')) 
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
            throw new Error (req.__('errores.habitaciones_cantidad', cant))
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
            throw new Error (req.__('errores.habitaciones_cantidad', cant))
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
            throw new Error (req.__('errores.habitaciones_cantidad', cant))
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
            throw new Error (req.__('errores.habitaciones_cantidad', cant))
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
            throw new Error (req.__('errores.habitaciones_cantidad', cant))
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
                    throw new Error (req.__('errores.habitacion_vacia')) 
                }

                if(cantTotal > capHabitacion){
                    throw new Error (req.__('errores.habitacion_capacidad')) 
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
            throw new Error (req.__('errores.huespedes_de_mas'))     
        }
        
        if(initialPeople.occupancy > totalPeople){
            throw new Error (req.__('errores.huespedes_de_menos'))   
        }

        return true
    })
)

const personalInfoValidation = [
    body('name').notEmpty().withMessage((value, { req }) => req.__('errores.nombre')),
    body('lastname').notEmpty().withMessage((value, { req }) => req.__('errores.apellido')),
    body('email').notEmpty().withMessage((value, { req }) => req.__('errores.mail')).custom(async (value,{req})=>{
        let email = req.body.email

        if(email.indexOf("@")==-1){
           throw new Error (req.__('errores.mail_invalido'))  
        }

        return true
    }),
    body('emailBis').notEmpty().withMessage((value, { req }) => req.__('errores.repetir_email')).custom(async (value,{req})=>{
        let email = req.body.email
        let emailBis = req.body.emailBis

        if(email != emailBis){
           throw new Error (req.__('errores.mails_no_coinciden'))  
        }

        return true
    }),
    body('phone').notEmpty().withMessage((value, { req }) => req.__('errores.telefono'))
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
            throw new Error (req.__('errores.reserva_registrada')) 
        }
        
        return true
    })   
]

const bookingSearchValidation = [
    body('booking_code').notEmpty().withMessage((value, { req }) => req.__('errores.codigo_reserva')),
    body('email').notEmpty().withMessage((value, { req }) => req.__('errores.mails_reserva')).custom(async (value,{req})=>{
        let email = req.body.email

        if(email.indexOf("@")==-1 || email == "solar@solardelacosta.com"){
           throw new Error (req.__('errores.mail_invalido'))  
        }

        return true 
    })
]

router.get("/roomSelection", searchValidation, bookingController.selectorHabitaciones)
router.post("/details", activeSessionMiddleware, initialValidation, bookingController.detallesFinales)
router.post("/information", activeSessionMiddleware, duplicatedBookingValidation, roomSelectionValidation, personalInfoValidation, bookingController.generarReservas)
router.get("/confirmed", activeSessionMiddleware, bookingController.reservaConfirmada)
router.get("/search",  bookingController.buscarReserva)
router.post("/search", bookingSearchValidation, bookingController.resultadosReserva)
router.delete("/cancel/:idBooking", bookingController.bookingCancel)

router.use((req, res, next) => {
  res.status(404).render("error/errorSession", {error:req.__('errores.no_continuar')})
});

module.exports=router