const path = require("path")
const express = require ("express")
const app = express()
const db = require('../database/models')
const router = express.Router()
const func = require('../functions/funciones')

const searchController = require("../controllers/searchController")

const {query} = require('express-validator')

const searchValidation = [
    query('check_in').notEmpty().withMessage('Completar fecha de Entrada').custom((value,{req})=>{
        let check_in = req.query.check_in
        let fechaHoy = new Date

        if(fechaHoy > func.formateoFecha(check_in)){
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

router.get("/", searchController.start)
router.get("/roomSelection", searchValidation, searchController.selectorHabitaciones)

module.exports=router