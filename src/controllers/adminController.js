const path = require("path")
const fs = require("fs")
const db = require('../database/models')
const Op = db.Sequelize.Op
const {validationResult}=require('express-validator')
const func = require('../functions/funciones')
const searchController = require("./searchController")

const controller = {
    cargaLogIn: async(req,res)=>{
        res.render("admin/adminLogin")
    },
    procesoLogIn: async(req,res)=>{
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("admin/adminLogin",{errors:errors.mapped(),oldInfo:req.query})
        }

        return res.redirect("/admin/menu")
    },
    cargaMenu: async(req,res)=>{
        let bookingsPendientes = await db.Booking.count({
            where:{
                state_id:2
            }
        })

        return res.render("admin/adminMenu",{bookingsPendientes})
    },
    cargaEdicion: async(req,res)=>{
        
        let tipos = await db.Room_Type.findAll({
            include:['rooms']
        })
        
        res.render("admin/adminRoomEdit",{tipos})
    },
    procesarEdicion: async(req, res)=>{
        let errors = validationResult(req)

        let tipos = await db.Room_Type.findAll({
            include:['rooms']
        })

        if (!errors.isEmpty()){
            return res.render("admin/adminRoomEdit",{tipos, errors:errors.mapped(),oldInfo:req.body})
        }

        for(const tipo of tipos){
            let precio = req.body['precio' + tipo.short_name]

            await db.Room_Type.update({
                price:precio
            },{
                where:{
                    id:tipo.id
                }
            })
        }

        let habitaciones = await db.Room.findAll()

        for(const habitacion of habitaciones){
            let disponibilidad = req.body['disp' + habitacion.id]

            await db.Room.update({
                available:disponibilidad
            },{
                where:{
                    id:habitacion.id
                }
            })
        }

        res.redirect("/admin/roomEdit")
    },
    cargaBanco: async(req,res)=>{
        
        let info = await db.Bank_Information.findByPk(1)
        
        res.render("admin/adminBankInfo",{info})
    },
    procesarBanco: async(req, res)=>{
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            let info = await db.Bank_Information.findByPk(1)
            return res.render("admin/adminBankInfo",{info, errors:errors.mapped(),oldInfo:req.body})
        }

        await db.Bank_Information.update({
            cbu:req.body.cbu,
            alias:req.body.alias,
            cuit:req.body.cuit,
            nombre:req.body.nombre,
            banco:req.body.banco,
        },{
            where:{
                id:1
            }
        })

        res.redirect("/admin/menu")
    },
    cargaDisponibilidad: async(req,res)=>{ 
        res.render("admin/adminDisponibilidad")
    },
    resultadosDisponibilidad: async(req,res)=>{ 
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("admin/adminDisponibilidad",{errors:errors.mapped(),oldInfo:req.query})
        }

        let infoBusqueda ={
            checkIn: req.query.check_in,
            checkOut: req.query.check_out,
            textoCheckIn: func.fechaATextoCorto(req.query.check_in),
            textoCheckOut: func.fechaATextoCorto(req.query.check_out)
        }
        let checkIn = req.query.check_in
        let checkOut = req.query.check_out
        
        let tipos = await func.habitacionesLibresExt(checkIn, checkOut)
        
        if (tipos.length==0){
            return res.render("booking/bookingError")
        }

        res.render("admin/adminResultadosDisp",{tipos, infoBusqueda})

    },
    cargaConfirmarReservas: async(req,res)=>{
        let bookingsPendientes = await db.Booking.findAll({
            where:{
                state_id:2
            },
            include:['guests','states']
        })

        for(const booking of bookingsPendientes){
            booking.totalFormateado = func.conversorNumero(booking.amount)
            booking.senaFormateado = func.conversorNumero(booking.downpayment)
            booking.checkInFormateado = func.fechaATextoCorto(booking.check_in)
            booking.checkOutFormateado = func.fechaATextoCorto(booking.check_out)
        }

        res.render("admin/adminBookConfirmation",{bookingsPendientes})

    },
    infoReserva: async(req,res)=>{
        let idBooking = req.params.idBooking
        let bookingInstance  = await db.Booking.findByPk(idBooking,{
            include:['guests','types_booked','rooms']
        })

        if(bookingInstance){
            let booking = bookingInstance.toJSON()
        
            booking.totalFormateado = func.conversorNumero(booking.amount)
            booking.senaFormateado = func.conversorNumero(booking.downpayment)
            booking.checkInFormateado = func.fechaATextoCorto(booking.check_in)
            booking.checkOutFormateado = func.fechaATextoCorto(booking.check_out)
            booking.formatoArchivo = booking.payment.split(".")[1]

            for(const room of booking.types_booked){
                room.opciones = await func.disponiblesPorTipo(booking.checkIn, booking.checkOut, room)
            }

            res.render("admin/adminBookingInfo",{booking})
        } else {
            res.send("HOY UN ERROR")
        }
    },
    confirmarReserva: async(req,res)=>{
        let idBooking = req.params.idBooking
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            let bookingInstance  = await db.Booking.findByPk(idBooking,{
                include:['guests','types_booked','rooms']
            })

            if(bookingInstance){
                let booking = bookingInstance.toJSON()
            
                booking.totalFormateado = func.conversorNumero(booking.amount)
                booking.senaFormateado = func.conversorNumero(booking.downpayment)
                booking.checkInFormateado = func.fechaATextoCorto(booking.check_in)
                booking.checkOutFormateado = func.fechaATextoCorto(booking.check_out)
                booking.formatoArchivo = booking.payment.split(".")[1]

                for(const room of booking.types_booked){
                    room.opciones = await func.disponiblesPorTipo(booking.checkIn, booking.checkOut, room)
                }

                return res.render("admin/adminBookingInfo",{booking,errors:errors.mapped(),oldInfo:req.body})
            } else {
                res.send("HOY UN ERROR")
            }
        }

        let bookingInstance  = await db.Booking.findByPk(idBooking,{
            include:['rooms']
        })

        if(bookingInstance){
            let booking = bookingInstance.toJSON()
            
            for(const room of booking.rooms){    
                console.log
                let habitacionAsignada = req.body['habitacion_' + room.id]
                await db.Booking_Room.update({
                    room_id:habitacionAsignada
                },{
                    where:{
                        id:room.id
                    }
                })
            }

            await db.Booking.update({
                state_id:3
            },{
                where:{
                    id:idBooking
                }
            })

            res.redirect("/admin/confirmar")
        }
    },
    eliminarReserva: async(req,res)=>{
        let idBooking = req.params.idBooking

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

        res.redirect("/admin/confirmar")
    }
}   

module.exports = controller