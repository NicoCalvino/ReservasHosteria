const path = require("path")
const fs = require("fs")
const db = require('../database/models')
const Op = db.Sequelize.Op
const func = require('../functions/funciones')
const {validationResult}=require('express-validator')
const moment = require('moment')

const controller = {
    detallesFinales: async(req,res)=>{
        let idTemp = req.session.idTemp
        let errors = validationResult(req)

        let infoTemp = await db.Temp.findByPk(idTemp)
        infoTemp.check_in_s = infoTemp.check_in
        infoTemp.check_out_s = infoTemp.check_out

        if (!errors.isEmpty()){
            let tiposHab = await func.habitacionesLibres(infoTemp.check_in, infoTemp.check_out)
            return res.render("search/roomSelection",{tiposHab, qHab:infoTemp.rooms, infoTemp, errors:errors.mapped(),oldInfo:req.body})
        }
        
        let tiposHab = await db.Room_Type.findAll()

        let selectedTypes = []
        let rangoSessions = []
        for(const tipo of tiposHab){
            let cantTipo = Number(req.body[tipo.short_name]) || 0
            for(let i = 1 ; i<=cantTipo; i ++){
                selectedTypes.push(tipo)
                rangoSessions.push(tipo.short_name)
            }
        }
        req.session.tipos = rangoSessions.toString()
    
        res.render("booking/finalInformation",{infoTemp, selectedTypes})
    },
    generarReservas: async(req,res)=>{
        let idTemp = req.session.idTemp
        let errors = validationResult(req)

        let infoTemp = await db.Temp.findByPk(idTemp)
        infoTemp.check_in_s = infoTemp.check_in
        infoTemp.check_out_s = infoTemp.check_out
        
        if (!errors.isEmpty()){
            let tipos = req.session.tipos
            let rangoTipos = tipos.split(",")
            let selectedTypes = []
            for(const tipo of rangoTipos){
                infoTipo = await db.Room_Type.findAll({
                    where:{
                        short_name:tipo
                    }
                })
                selectedTypes.push(infoTipo[0])
            }
            
            return res.render("booking/finalInformation",{infoTemp, selectedTypes, errors:errors.mapped(),oldInfo:req.body})
        }

        let cantNoches = func.cantNoches(infoTemp.check_in, infoTemp.check_out)

        let tiposHab = await db.Room_Type.findAll()
        let roomDetails = []
        let downAmount = 0
        let totalAmount = 0
        for(let i = 0 ; i < 13 ; i++){
            tiposHab.forEach(tipo =>{
                let cantMayores = req.body['mayores' + i + "_" + tipo.short_name]
                let cantMenores = req.body['menores' + i + "_" + tipo.short_name]

                if(cantMayores == undefined){cantMayores=0}
                if(cantMenores == undefined){cantMenores=0}

                let cantTotal = Number(cantMayores) + Number(cantMenores)
                if(cantTotal > 0){
                    let montoHabitacion = Number(tipo.price) * cantNoches
                    totalAmount += montoHabitacion
                    switch (cantNoches){
                        case 1:
                        case 2:
                        case 3:
                            downAmount += Number(tipo.price)
                            break
                        default:
                            downAmount += montoHabitacion * 0.3
                    }
                    
                    roomDetails.push({
                        type:tipo.id,
                        adults:cantMayores,
                        children:cantMenores
                    })
                }
            })
        }
        
        let nombre = req.body.name
        let lastname = req.body.lastname
        let email = req.body.email
        let phone = req.body.phone

        db.Guest.create({
            name:nombre,
            lastname:lastname,
            email:email,
            phone:phone,
        }).then(async guest =>{
            let booking = await db.Booking.create({
                    check_in:infoTemp.check_in,
                    check_out:infoTemp.check_out,
                    nights:cantNoches,
                    occupancy:infoTemp.occupancy,
                    room_count:infoTemp.rooms,
                    downpayment: downAmount,
                    payment:"noPayment.png",
                    amount: totalAmount,
                    guest_id:guest.id,
                    temp_id:idTemp,
                    state_id:1
            })
            
            await db.Booking.update({
                booking_code:"HSC" + String(booking.id).padStart(5,"0")
            },{
                where:{
                    id:booking.id
                }
            })
            
            for(const room of roomDetails){
                await db.Booking_Room.create({
                    check_in:infoTemp.check_in,
                    check_out:infoTemp.check_out,
                    adults:room.adults,
                    children:room.children,
                    booking_id:booking.id,
                    room_type_id:room.type,
                })
            }

            let fechaComentario = new Date
            await db.Comment.create({
                comment:"AUTO - El huésped ha iniciado la reserva",
                date:fechaComentario,
                state_id:1,
                booking_id:booking.id
            })

            req.session.idTemp = false
            req.session.booking = booking.id
            res.redirect("/booking/confirmed")
        }).then()
    },
    reservaConfirmada: async(req, res)=>{
        let idBooking = req.session.booking 

        let infoBooking = await db.Booking.findByPk(idBooking)
        let infoBanco = await db.Bank_Information.findAll()

        let bookedRooms = await db.Booking_Room.findAll({
            where:{
                booking_id:idBooking
            }
        })

        if(bookedRooms.length != infoBooking.room_count){
            await db.Booking.destroy({
                where:{
                    id:idBooking
                }
            })

            await db.Booking_room.destroy({
                where:{
                    booking_id:idBooking
                }
            })
            
            return res.redirect("error/booking")
        }

        let fechaComentario = new Date
        await db.Comment.create({
            comment:"AUTO - El huésped ha confirmado la reserva",
            date:fechaComentario,
            state_id:1,
            booking_id:idBooking
        })

        infoBooking.montoFormateado = func.conversorNumero(infoBooking.amount)
        infoBooking.montoReservaFormateado = func.conversorNumero(infoBooking.downpayment)

        res.render("booking/bookingConfirmed",{infoBooking, infoBcaria:infoBanco[0]})
    
    },
    buscarReserva: async(req, res)=>{
        res.render("booking/bookingSearch")
    },
    resultadosReserva: async(req, res)=>{
        let errors = validationResult(req)
        let fechaHoy = new Date
        
        if (!errors.isEmpty()){
            return res.render("booking/bookingSearch",{errors:errors.mapped(),oldInfo:req.body})
        }

        let codigoReserva = req.body.booking_code
        let emailReserva = req.body.email

        let guestBooking = await db.Booking.findAll({
            where:{
                booking_code:codigoReserva
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
            return res.render("booking/bookingSearch",{mensajePagina:"No se encontró reserva con los datos indicados",oldInfo:req.body})   
        }

        guestBooking[0].montoFormateado = func.conversorNumero(guestBooking[0].amount)
        guestBooking[0].montoReservaFormateado = func.conversorNumero(guestBooking[0].downpayment)
        guestBooking[0].check_in_txt = func.fechaATexto(guestBooking[0].check_in)
        guestBooking[0].check_out_txt = func.fechaATexto(guestBooking[0].check_out)
        guestBooking[0].antiguedad = func.cantNochesSinFormato(guestBooking[0].created_at, fechaHoy)
        switch(guestBooking[0].state_id){
            case 1:
                guestBooking[0].estado = "Pendiente"
                guestBooking[0].explicacion = "La seña correspondiente a su reserva aún no ha sido recibida"
                break
            case 2:
                guestBooking[0].estado = "Procesando"
                guestBooking[0].explicacion = "Su pago ha sido recibido y esta siendo revisado por el hotel"
                break
            case 3:
                guestBooking[0].estado = "Confirmada"
                guestBooking[0].explicacion = "Su pago ha sido verificado y su reserva está confirmada. ¡Lo esperamos!"
                break
        }

        req.session.codigoReserva = codigoReserva
        req.session.emailReserva = emailReserva

        res.render("booking/bookingStatus",{bookingInfo:guestBooking[0]})   
    },
    bookingCancel: async(req, res)=>{
        let idBooking = req.params.idBooking
        
        if(!req.session.codigoReserva || !req.session.emailReserva){
            return res.render("error/errorSession",{error:"No se puede continuar"})
        }

        let bookingSession = req.session.codigoReserva
        let emailReserva = req.session.emailReserva

        let guestBooking = await db.Booking.findAll({
            where:{
                booking_code:bookingSession
            },
            include: ['guests']
        })

        if(guestBooking[0].guests.email != emailReserva){
            return res.render("error/errorSession",{error:"No se puede continuar"})
        }

        await db.Booking.update({
            state_id:4
        },{
            where:{
                id:idBooking
            }
        })

        await db.Booking.destroy({
            where:{
                id:idBooking
            }
        })

        await db.Booking_Room.destroy({
            where:{
                booking_id:idBooking
            }
        })

        let fechaComentario = new Date
        await db.Comment.create({
            comment:"AUTO - La reserva fue cancelada por el usuario",
            date:fechaComentario,
            state_id:4,
            booking_id:idBooking
        })

        res.render("error/errorSession",{error:"Reserva Cancelada"})
        
    }
}

module.exports = controller