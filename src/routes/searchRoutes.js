const express = require ("express")
const app = express()
const db = require('../database/models')
const moment = require('moment')
const router = express.Router()


const searchController = require("../controllers/searchController")

const {body} = require('express-validator')
const {query} = require('express-validator')

const searchValidation = [
    query('check_in').notEmpty().withMessage('Completar fecha de Entrada').custom((value,{req})=>{
        let check_in = req.query.check_in
        let fechaHoy = moment(new Date).format('L')

        if(fechaHoy > moment(check_in)){
           throw new Error ('La fecha de Entrada no puede ser en el pasado')  
        }

        return true
    }),
    query('check_out').notEmpty().withMessage('Completar fecha de Salida').custom((value,{req})=>{
        let check_in = req.query.check_in
        let check_out = req.query.check_out

        if(check_in > check_out){
           throw new Error ('La fecha de Salida no puede ser anterior a la de entrada')  
        }

        return true
    }),
    query('people').notEmpty().withMessage('Completar la cantidad de Huespedes').custom((value,{req})=>{
        let cantidad = req.query.people

        if(cantidad <= 0){
           throw new Error ('Los Huespedes no pueden ser 0')  
        }

        return true
    }),
    query('rooms').notEmpty().withMessage('Completar la cantidad de habitaciones deseadas').custom((value,{req})=>{
        let cantidad = Number(req.query.rooms)
        let huespedes = Number(req.query.people)

        if(cantidad <= 0){
           throw new Error ('Las Habitaciones no puede ser 0')  
        }
        
        if(cantidad > huespedes){
           throw new Error ('La cantidad de Huespedes no puede ser menor a la cantidad de habitaciones')  
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

        let habHotel = await db.Room.findAll({
            where:{
                room_type_id:roomType[0].id
            },
            include:['room_types']
        })

        let habLibres =[]
        for(const habitacion of habHotel){

            let diasAlquilados = await searchController.disponibilidadHabitacion(infoTemp.check_in, infoTemp.check_out, habitacion.id)

            if(diasAlquilados==0){
                habLibres.push(habitacion)
            }
        }

        if(habLibres.length < cant){
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

        let habHotel = await db.Room.findAll({
            where:{
                room_type_id:roomType[0].id
            },
            include:['room_types']
        })

        let habLibres =[]
        for(const habitacion of habHotel){
            let diasAlquilados = await searchController.disponibilidadHabitacion(infoTemp.check_in, infoTemp.check_out, habitacion.id)

            if(diasAlquilados==0){
                habLibres.push(habitacion)
            }
        }

        if(habLibres.length < cant){
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

        let habHotel = await db.Room.findAll({
            where:{
                room_type_id:roomType[0].id
            },
            include:['room_types']
        })

        let habLibres =[]
        for(const habitacion of habHotel){
            let diasAlquilados = await searchController.disponibilidadHabitacion(infoTemp.check_in, infoTemp.check_out, habitacion.id)

            if(diasAlquilados==0){
                habLibres.push(habitacion)
            }
        }

        if(habLibres.length < cant){
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

        let habHotel = await db.Room.findAll({
            where:{
                room_type_id:roomType[0].id
            },
            include:['room_types']
        })

        let habLibres =[]
        for(const habitacion of habHotel){
            let diasAlquilados = await searchController.disponibilidadHabitacion(infoTemp.check_in, infoTemp.check_out, habitacion.id)

            if(diasAlquilados==0){
                habLibres.push(habitacion)
            }
        }

        if(habLibres.length < cant){
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

        let habHotel = await db.Room.findAll({
            where:{
                room_type_id:roomType[0].id
            },
            include:['room_types']
        })

        let habLibres =[]
        for(const habitacion of habHotel){
            let diasAlquilados = await searchController.disponibilidadHabitacion(infoTemp.check_in, infoTemp.check_out, habitacion.id)

            if(diasAlquilados==0){
                habLibres.push(habitacion)
            }
        }

        if(habLibres.length < cant){
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
            throw new Error ('Se asignaron mas personas de las reservadas inicialmente')     
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


router.get("/", searchController.start)
router.get("/roomSelection", searchValidation, searchController.selectorHabitaciones)
router.post("/bookingDetails", initialValidation, searchController.detallesFinales)
router.post("/bookingInformation", duplicatedBookingValidation, roomSelectionValidation, personalInfoValidation, searchController.generarReservas)
router.get("/bookingConfirmed", searchController.reservaConfirmada)
router.get("/paymentUpload", searchController.cargarPago)


module.exports=router