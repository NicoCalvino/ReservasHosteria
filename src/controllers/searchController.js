const path = require("path")
const fs = require("fs")
const db = require('../database/models')
const Op = db.Sequelize.Op
const func = require('../functions/funciones')
const {validationResult}=require('express-validator')
const moment = require('moment')

const controller = {
    start: async(req,res)=>{
        res.render("search/initialSearch")
    },
    selectorHabitaciones: async(req,res)=>{
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("search/initialSearch",{errors:errors.mapped(),oldInfo:req.query})
        }

        let checkIn = req.query.check_in
        let checkOut = req.query.check_out
        let personas = req.query.people
        let qHab = req.query.rooms

        let infoTemp = await db.Temp.create({
            check_in:checkIn,
            check_out:checkOut,
            occupancy:personas,
            rooms:qHab
        })
            req.session.idTemp = infoTemp.id

            infoTemp.check_in_s = checkIn
            infoTemp.check_out_s = checkOut

        let tiposHab = await controller.habitacionesLibres(checkIn, checkOut)
        
        if (tiposHab.length==0){
            return res.render("booking/bookingError")
        }
        
        res.render("search/roomSelection",{tiposHab, qHab, infoTemp, oldInfo:req.query})
    },
    habitacionesLibres: async (checkIn, checkOut)=>{
        let habHotel = await db.Room_Type.findAll()

        let tiposHab =[]
        for(const tipo of habHotel){
            let disponibles = await controller.disponibilidadTipo(checkIn, checkOut, tipo)

            if(disponibles > 0){
                tipo.cantidad = disponibles
                tipo.precioForm = func.conversorNumero(tipo.price)
                tiposHab.push(tipo)
            }
        }

        return tiposHab
    },
    disponibilidadTipo: async(checkIn, checkOut, tipo)=>{
        quantity = await db.Room.count({
            where:{
                available:true,
                room_type_id:tipo.id
            }
        })

        /*Bookings que empiezan antes*/
        let bookingsAntes = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.lte]:checkIn,
                },
                check_out:{
                    [Op.between]:[checkIn, checkOut]
                },
                room_type_id:tipo.id
            }
        })

        /*Bookings que empiezan despues*/
        let bookingsDespues = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.between]:[checkIn, checkOut]
                },
                room_type_id:tipo.id
            }
        })

        let disponibles = quantity - bookingsAntes - bookingsDespues

        return disponibles

    }
}

module.exports = controller