const path = require("path")
const fs = require("fs")
const db = require('../database/models')
const Op = db.Sequelize.Op
const func = require('../functions/funciones')
const {validationResult}=require('express-validator')
const moment = require('moment')

const searchController = require("./searchController")

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

            console.log("*******************")
            console.log("\n" + func.cantNoches(req.query.check_in, req.query.check_out))
            console.log("*******************")

        let tiposHab = await controller.habitacionesLibres(checkIn, checkOut)

        res.render("search/roomSelection",{tiposHab, qHab, infoTemp, oldInfo:req.query})
    },
    habitacionesLibresBis: async (checkIn, checkOut)=>{
        let habHotel = await db.Room.findAll({
            include:['room_types']
        })
        
        let habLibres =[]
        for(const habitacion of habHotel){
            let diasAlquilados = await controller.disponibilidadHabitacion(checkIn, checkOut, habitacion.id)

            if(diasAlquilados==0){
                habLibres.push(habitacion)
            }
        }

        let tiposHab = await db.Room_Type.findAll()
        for(const tipo of tiposHab){
            let cantidad = 0
            for(const habitacion of habLibres){
                if(habitacion.room_types.short_name == tipo.short_name){
                    cantidad++
                }
            }
            tipo.cantidad = cantidad
            tipo.precioForm = func.conversorNumero(tipo.price)
        }

        return tiposHab
    },
    disponibilidadHabitacionBis: async(checkIn, checkOut, id)=>{
        /*Bookings que estan entre las fechas y molestan*/
        let bookingsDurante = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.gte]:checkIn,
                },
                check_out:{
                    [Op.lte]:checkOut
                },
                room_id:id
            }
        })

        /*Bookings que empiezan antes y joden*/
        let bookingsAntes = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.lte]:checkIn,
                },
                check_out:{
                    [Op.between]:[checkIn, checkOut]
                },
                room_id:id
            }
        })

        /*Bookings que empiezan despues y joden*/
        let bookingsDespues = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.between]:[checkIn, checkOut]
                },
                room_id:id
            }
        })

        let total = bookingsAntes + bookingsDespues + bookingsDurante

        return total

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

        let disponibles = tipo.quantity - bookingsAntes - bookingsDespues

        return disponibles

    },
    detallesFinales: async(req,res)=>{
        let idTemp = req.session.idTemp
        let errors = validationResult(req)

        let infoTemp = await db.Temp.findByPk(idTemp)
        infoTemp.check_in_s = infoTemp.check_in
        infoTemp.check_out_s = infoTemp.check_out

        if (!errors.isEmpty()){
            let tiposHab = await controller.habitacionesLibres(infoTemp.checkIn, infoTemp.checkOut)
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
    
        res.render("search/finalInformation",{infoTemp, selectedTypes})
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
            
            return res.render("search/finalInformation",{infoTemp, selectedTypes, errors:errors.mapped(),oldInfo:req.body})
        }

        let tiposHab = await db.Room_Type.findAll()
        let roomDetails = []
        let totalAmount = 0
        for(let i = 0 ; i < 13 ; i++){
            tiposHab.forEach(tipo =>{
                let cantMayores = req.body['mayores' + i + "_" + tipo.short_name]
                let cantMenores = req.body['menores' + i + "_" + tipo.short_name]

                if(cantMayores == undefined){cantMayores=0}
                if(cantMenores == undefined){cantMenores=0}

                let cantTotal = Number(cantMayores) + Number(cantMenores)
                if(cantTotal > 0){
                    totalAmount += Number(tipo.price)
                    roomDetails.push({
                        type:tipo.short_name,
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
                    occupancy:infoTemp.occupancy,
                    room_count:infoTemp.rooms,
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
                await controller.guardadoReserva(booking.id, room.type, room.adults, room.children, infoTemp.check_in, infoTemp.check_out)
            }

            req.session.booking = booking.id
            res.redirect("/bookingConfirmed")
        })

    },
    guardadoReserva: async(bookingId, tipo, adults, children, checkIn, checkOut)=>{
        let infoTipo = await db.Room_Type.findAll({
            where:{
                short_name:tipo
            }
        })

        let habTipo = await db.Room.findAll({
            where:{
                room_type_id:infoTipo[0].id
            }
        })

        for(const habitacion of habTipo){
            let diasAlquilados = await controller.disponibilidadHabitacion(checkIn, checkOut, habitacion.id)

            if(diasAlquilados == 0){
                await db.Booking_Room.create({
                    check_in:checkIn,
                    check_out:checkOut,
                    adults:adults,
                    children:children,
                    booking_id:bookingId,
                    room_id:habitacion.id,
                })

                return
            }
        }
    },
    reservaConfirmada: async(req, res)=>{
        let idBooking =1

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
            
            return res.render("search/bookingError")
        }

        infoBooking.montoFormateado = func.conversorNumero(infoBooking.amount)
        let montoReserva = Number(infoBooking.amount)*0.10
        infoBooking.montoReservaFormateado = func.conversorNumero(montoReserva)

        res.render("search/bookingConfirmed",{infoBooking, infoBcaria:infoBanco[0]})
        

    },
    cargarPago: async(req, res)=>{
        res.render("search/paymentUpload")
    },
    pagoCargado:async(req, res)=>{
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("search/paymentUpload",{errors:errors.mapped(),oldInfo:req.body})
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
            return res.render("search/paymentUpload",{mensajePagina:"No se encontro reserva con los datos indicados",oldInfo:req.body})   
        }

        await db.Booking.update({
            payment:req.file.filename,
            state_id:2
        },{
            where:{
                id:guestBooking[0].id
            }
        })

        res.render("search/paymentConfirmation")   
    }
}

module.exports = controller