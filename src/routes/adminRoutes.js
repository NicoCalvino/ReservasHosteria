const express = require ("express")
const db = require('../database/models')
const router = express.Router()
const bcryptjs = require('bcryptjs')
const func = require("../functions/funciones")
const adminSessionMiddleware = require ("../middlewares/adminSessionMiddleware")

const {body} = require('express-validator')
const {query} = require('express-validator')

const userCreationMiddleware = require('../middlewares/userCreationMiddleware')
const guestMiddleware = require('../middlewares/guestMiddleware')
const loggedInMiddleware = require('../middlewares/loggedInMiddleware')

const adminController = require("../controllers/adminController")
const logInDataValidation = [
    body('user_name').notEmpty().withMessage('Completar el usuario'),
    body('password').notEmpty().withMessage('Completar la contraseña'),
    body('login').custom(async (value,{req})=>{
        let user_name = req.body.user_name
        let password = req.body.password

        let existente = await db.User.findAll({
            where:{
                user_name:user_name
            }
        })

        if(user_name != "" && password != ""){
            if(existente.length == 0){
                throw new Error ('Información incorrecta') 
            }else if(!bcryptjs.compareSync(password,existente[0].password, 10)){
                throw new Error ('Información incorrecta') 
            }
        }
        return true 
    })
]

const roomEditValidation = [
    body('preciotrpvj').notEmpty().withMessage('Completar el precio').isFloat({min:1}).withMessage('Precio Incorrecto'),
    body('preciodblvm').notEmpty().withMessage('Completar el precio').isFloat({min:1}).withMessage('Precio Incorrecto'),
    body('preciodblvj').notEmpty().withMessage('Completar el precio').isFloat({min:1}).withMessage('Precio Incorrecto'),
    body('preciohab4').notEmpty().withMessage('Completar el precio').isFloat({min:1}).withMessage('Precio Incorrecto'),
    body('preciosuite').notEmpty().withMessage('Completar el precio').isFloat({min:1}).withMessage('Precio Incorrecto'),
    body('disp1').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp2').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp3').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp4').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp5').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp6').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp7').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp8').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp9').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp10').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp11').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp12').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp13').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    body('disp14').notEmpty().withMessage('Indicar Disponibilidad').isNumeric({min:0, max:1}).withMessage('Valor Incorrecto'),
    
]

const bankInfoValidation = [
    body('cbu').notEmpty().withMessage('Completar el CBU').isNumeric().withMessage('CBU Incorrecto').isLength(22).withMessage('CBU Incorrecto'),
    body('alias').notEmpty().withMessage('Completar el alias'),
    body('nombre').notEmpty().withMessage('Completar el nombre'),
    body('banco').notEmpty().withMessage('Completar el banco'),
    body('cuit').notEmpty().withMessage('Completar el CUIT').isLength(13).withMessage('CUIT Incorrecto').custom(async (value,{req})=>{
        let cuit = req.body.cuit
        
        if(cuit[2] != "-"){
            throw new Error ('CUIT Incorrecto') 
        }else if(cuit[11] != "-"){
            throw new Error ('CUIT Incorrecto') 
        }else{
            let partes = cuit.split("-")

            if(partes[0].length !=2){
                throw new Error ('CUIT Incorrecto')
            }else if(partes[1].length != 8){
                throw new Error ('CUIT Incorrecto')
            }else if(partes[2].length != 1){
                throw new Error ('CUIT Incorrecto')
            }
        }
        
        return true
    })
]

const searchValidation = [
    query('check_in').notEmpty().withMessage('Completar fecha de entrada').custom((value,{req})=>{
        let check_in = req.query.check_in
        let fechaHoy = new Date

        if(fechaHoy > func.formateoFecha(check_in)){
           throw new Error ('La fecha de entrada no puede ser en el pasado')  
        }

        return true
    }),
    query('check_out').notEmpty().withMessage('Completar fecha de salida').custom((value,{req})=>{
        let check_in = req.query.check_in
        let check_out = req.query.check_out

        if(check_in > check_out){
           throw new Error ('La fecha de salida no puede ser anterior a la de entrada')  
        }

        return true
    }),
]

const occupancyValidation = [
    query('check_in').notEmpty().withMessage('Completar fecha de entrada'),
    query('check_out').notEmpty().withMessage('Completar fecha de salida').custom((value,{req})=>{
        let check_in = req.query.check_in
        let check_out = req.query.check_out

        if(check_in > check_out){
           throw new Error ('La fecha de salida no puede ser anterior a la de entrada')  
        }

        return true
    }),
]

const dateGuestsValidation = [
    query('fecha').notEmpty().withMessage('Completar fecha'),
]

const roomSelectionValidation = [
    body('habitaciones').custom((value,{req})=>{
        let todoCompleto = true
        let todasHabitaciones = []
        for (const key in req.body) {
            if (key.startsWith('habitacion_')) {
                if(!req.body[key]){
                    todoCompleto = false
                }else{
                    todasHabitaciones.push(req.body[key])
                }
            }
        }

        let habitacionesUnicas = [...new Set(todasHabitaciones)]

        if(!todoCompleto){
           throw new Error ('Completar todas las habitaciones')  
        }

        if(habitacionesUnicas.length < todasHabitaciones.length){
           throw new Error ('No puede asignar la misma habitación más de una vez')  
        }

        return true
    }),
]

const bookingEditValidation = [
    body('habitaciones').custom(async (value,{req})=>{
        for (const key in req.body) {
            if (key.startsWith('habitacion_')) {
                habitacionElegida = req.body[key]

                infoHabitacion = await db.Room.findByPk(habitacionElegida,{
                    include:['room_types']
                })

                camposSeparados = key.split("_")
                nroCampo = camposSeparados[1]

                let cantMayores = req.body['adults' + nroCampo]
                let cantMenores = req.body['children' + nroCampo]

                if(cantMayores == undefined){cantMayores=0}
                if(cantMenores == undefined){cantMenores=0}

                let cantTotal = Number(cantMayores) + Number(cantMenores)

                if(cantTotal == 0){
                    throw new Error ('No puede haber habitaciones vacías') 
                }

                if(cantTotal > infoHabitacion.room_types.occupancy){
                    throw new Error ('No puede superar la capacidad de la habitación') 
                }
            }
        }

        return true
    }),
]

const roomBookingValidation = [
    body('name').notEmpty().withMessage('Completar el nombre'),
    body('lastname').notEmpty().withMessage('Completar el apellido'),
    body('ocupacion').custom(async (value,{req})=>{
        let cantMayores = req.body.adults
        let cantMenores = req.body.children

        if(cantMayores == undefined){cantMayores=0}
        if(cantMenores == undefined){cantMenores=0}

        let cantTotal = Number(cantMayores) + Number(cantMenores)
        
        if(cantTotal == 0){
            throw new Error ('Indicar ocupantes de la habitación')     
        }

        let habitacion = req.body.habitacion
        console.log(habitacion)
        if (habitacion){
            let infoCuarto = await db.Room.findByPk(habitacion,{
                    include:['room_types']
                })

                console.log(cantTotal)
                console.log(infoCuarto.room_types.occupancy)

            if(habitacion && cantTotal > infoCuarto.room_types.occupancy){
                throw new Error ('No se puede superar la capacidad de la habitación')     
            }
        }
        
        return true
    }),
    body('habitacion').notEmpty().withMessage('Indicar la habitación'),
]

const bookingStateValidation = [
    body('estado').notEmpty().withMessage('Indicar el estado'),
    body('comentarios').notEmpty().withMessage('Completar los comentarios'),
]

router.get("/login", loggedInMiddleware, userCreationMiddleware, adminController.cargaLogIn)
router.post("/login", loggedInMiddleware, logInDataValidation, adminController.procesoLogIn)

router.get("/logOut", adminController.procesoLogOut)

router.get("/menu", guestMiddleware, adminController.cargaMenu)

router.get("/roomEdit", guestMiddleware, adminController.cargaEdicion)
router.put("/roomEdit", guestMiddleware, roomEditValidation, adminController.procesarEdicion)

router.get("/bankEdit", guestMiddleware, adminController.cargaBanco)
router.put("/bankEdit", guestMiddleware, bankInfoValidation, adminController.procesarBanco)

router.get("/disponibilidad", guestMiddleware, adminController.cargaDisponibilidad)
router.get("/resultados", guestMiddleware, searchValidation, adminController.resultadosDisponibilidad)

router.get("/ocupacion", guestMiddleware, adminController.cargarOcupacion)
router.get("/reporteOcupacion", guestMiddleware, occupancyValidation, adminController.resultadosOcupacion)

router.get("/fechasReservarHabitacion", guestMiddleware, adminController.cargarFechasReservar)
router.get("/reservarHabitacion", guestMiddleware,occupancyValidation, adminController.cargarReservarHabitacion)
router.post("/reservarHabitacion", guestMiddleware, adminSessionMiddleware, roomBookingValidation, adminController.procesoReservaHabitacion)

router.get("/huespedesDelDia", guestMiddleware, adminController.cargarHuespedesDelDia)
router.get("/listaDelDia", guestMiddleware, dateGuestsValidation, adminController.resultadosHuespedesDelDia)

router.get("/confirmar", guestMiddleware, adminController.cargaConfirmarReservas)
router.post("/confirmarReserva/:idBooking", guestMiddleware, roomSelectionValidation, adminController.confirmarReserva)
router.put("/editarReserva/:idBooking", guestMiddleware, roomSelectionValidation, bookingEditValidation, adminController.editarReserva)
router.put("/forzarEstado/:idBooking", guestMiddleware, bookingStateValidation,  adminController.cambiarEstado)
router.delete("/eliminarReserva/:idBooking", guestMiddleware, adminController.eliminarReserva)

router.get("/buscarReservas", guestMiddleware,  adminController.cargarBusquedaReservas)
router.get("/resultadosBusqueda", guestMiddleware,  adminController.resultadosBusqueda)

router.get("/verReserva/:idBooking", guestMiddleware,  adminController.infoReserva)

module.exports=router