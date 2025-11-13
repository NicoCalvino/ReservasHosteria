const path = require("path")
const fs = require("fs")
const db = require('../database/models')
const Op = db.Sequelize.Op
const func = require('../functions/funciones')
const {validationResult}=require('express-validator')
const moment = require('moment')

const controller = {
    cargarPago: async(req, res)=>{
        res.render("payment/paymentUpload")
    },
    pagoCargado:async(req, res)=>{
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("payment/paymentUpload",{errors:errors.mapped(),oldInfo:req.body})
        }

        let codigoReserva = req.body.booking_code
        let emailReserva = req.body.email

        let guestBooking = await db.Booking.findAll({
            where:{
                booking_code:codigoReserva,
                state_id:1
            },
            include: [{
                model: db.Guest, 
                as: 'guests',
                required: true, 
                where: {
                    email: emailReserva
                }
            }]
        })

        if(guestBooking.length == 0){
            return res.render("payment/paymentUpload",{mensajePagina:"No se encontró reserva con los datos indicados",oldInfo:req.body})   
        }

        await db.Booking.update({
            payment:req.file.filename,
            state_id:2
        },{
            where:{
                id:guestBooking[0].id
            }
        })

        let fechaComentario = new Date
        await db.Comment.create({
            comment:"AUTO - El huésped ha informado un pago",
            date:fechaComentario,
            state_id:2,
            booking_id:guestBooking[0].id
        })

        res.render("payment/paymentConfirmation")   
    }
}

module.exports = controller