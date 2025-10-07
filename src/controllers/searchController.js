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
    habitacionesLibres: async (checkIn, checkOut)=>{
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
    disponibilidadHabitacion: async(checkIn, checkOut, id)=>{
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

        infoTemp.check_in_s = checkIn
        infoTemp.check_out_s = checkOut

        let tiposHab = await controller.habitacionesLibres(checkIn, checkOut)

        res.render("search/roomSelection",{tiposHab, qHab, infoTemp, oldInfo:req.query})
    },
    detallesFinales: async(req,res)=>{
        let idTemp = req.params.idTemp
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
        let idTemp = req.params.idTemp
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
        for(let i = 0 ; i < 13 ; i++){
            tiposHab.forEach(tipo =>{
                let cantMayores = req.body['mayores' + i + "_" + tipo.short_name]
                let cantMenores = req.body['menores' + i + "_" + tipo.short_name]

                if(cantMayores == undefined){cantMayores=0}
                if(cantMenores == undefined){cantMenores=0}

                let cantTotal = Number(cantMayores) + Number(cantMenores)
                console.log("****************************")
                console.log('mayores' + i + "_" + tipo.short_name)
                console.log('menores' + i + "_" + tipo.short_name)
                console.log(cantTotal)
                console.log("****************************")
                if(cantTotal > 0){
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
            await db.Booking.create({
                check_in:infoTemp.check_in,
                check_out:infoTemp.check_out,
                occupancy:infoTemp.occupancy,
                guest_id:guest.id,
                state_id:1
            }).then(async booking =>{
                for(const room of roomDetails){
                    await controller.guardadoReserva(booking.id, room.type, room.adults, room.children, infoTemp.check_in, infoTemp.check_out)
                }
            })
        })

        res.redirect("/")

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
    }
}

module.exports = controller