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

        req.session.user_logged = req.body.user_name

        if(req.body.recordar){
            res.cookie('user_logged',req.body.user_name,{maxAge:1250000000})
        }

        return res.redirect("/admin/menu")
    },
    procesoLogOut: async(req,res)=>{
        req.session.destroy()
        res.clearCookie('user_logged')

        return res.redirect("/admin/login")
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
        res.render("admin/adminDatesSearch",{
            titulo:"Disponibilidad",
            direccion:"/admin/resultados",
            desde:"Check In",
            hasta:"Check Out",
            boton:"BUSCAR"
        })
    },
    resultadosDisponibilidad: async(req,res)=>{ 
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("admin/adminDatesSearch",{
                titulo:"Disponibilidad",
                direccion:"/admin/resultados",
                desde:"Check In",
                hasta:"Check Out",
                boton:"BUSCAR",
                errors:errors.mapped(),
                oldInfo:req.query
            })
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

        res.render("admin/adminBookingsList",{bookingsLista:bookingsPendientes, linkVuelta:"/admin/menu"})

    },
    infoReserva: async(req,res)=>{
        let idBooking = req.params.idBooking
        let bookingInstance  = await db.Booking.findByPk(idBooking,{
            include:['guests','rooms']
        })

        if(bookingInstance){
            let booking = bookingInstance.toJSON()

            booking.totalFormateado = func.conversorNumero(booking.amount)
            booking.senaFormateado = func.conversorNumero(booking.downpayment)
            booking.checkInFormateado = func.fechaATextoMesCortado(booking.check_in)
            booking.checkOutFormateado = func.fechaATextoMesCortado(booking.check_out)
            booking.formatoArchivo = booking.payment.split(".")[1]
            
            for(const room of booking.rooms){
                infoCuarto = await db.Room_Type.findByPk(room.room_type_id)
                room.opciones = await func.disponiblesPorTipo(booking.check_in, booking.check_out, infoCuarto)
                room.description = infoCuarto.room_name
                room.occupancy = infoCuarto.occupancy
                if(room.room_id){
                    let detalleHabitacion = await db.Room.findByPk(room.room_id)
                    room.number=detalleHabitacion.number
                }
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
                include:['guests','rooms']
            })

            if(bookingInstance){
                let booking = bookingInstance.toJSON()

                booking.totalFormateado = func.conversorNumero(booking.amount)
                booking.senaFormateado = func.conversorNumero(booking.downpayment)
                booking.checkInFormateado = func.fechaATextoMesCortado(booking.check_in)
                booking.checkOutFormateado = func.fechaATextoMesCortado(booking.check_out)
                booking.formatoArchivo = booking.payment.split(".")[1]
                
                for(const room of booking.rooms){
                    infoCuarto = await db.Room_Type.findByPk(room.room_type_id)
                    room.opciones = await func.disponiblesPorTipo(booking.check_in, booking.check_out, infoCuarto)
                    room.description = infoCuarto.room_name
                    room.occupancy = infoCuarto.occupancy
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
    editarReserva: async(req,res)=>{
        let idBooking = req.params.idBooking
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            let bookingInstance  = await db.Booking.findByPk(idBooking,{
                include:['guests','rooms']
            })

            if(bookingInstance){
                let booking = bookingInstance.toJSON()

                booking.totalFormateado = func.conversorNumero(booking.amount)
                booking.senaFormateado = func.conversorNumero(booking.downpayment)
                booking.checkInFormateado = func.fechaATextoMesCortado(booking.check_in)
                booking.checkOutFormateado = func.fechaATextoMesCortado(booking.check_out)
                booking.formatoArchivo = booking.payment.split(".")[1]
                
                for(const room of booking.rooms){
                    infoCuarto = await db.Room_Type.findByPk(room.room_type_id)
                    room.opciones = await func.disponiblesPorTipo(booking.check_in, booking.check_out, infoCuarto)
                    room.description = infoCuarto.room_name
                    room.occupancy = infoCuarto.occupancy
                    if(room.room_id){
                        let detalleHabitacion = await db.Room.findByPk(room.room_id)
                        room.number = detalleHabitacion.number
                    }
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
            
            let totalOccupancy = 0
            for(const room of booking.rooms){    
                let habitacionAsignada = req.body['habitacion_' + room.id]
                
                let cantMayores = req.body['adults' + nroCampo]
                let cantMenores = req.body['children' + nroCampo]

                if(cantMayores == undefined){cantMayores=0}
                if(cantMenores == undefined){cantMenores=0}

                totalOccupancy += Number(cantMayores)
                totalOccupancy += Number(cantMenores)

                await db.Booking_Room.update({
                    room_id:habitacionAsignada,
                    adults:cantMayores,
                    children:cantMenores
                },{
                    where:{
                        id:room.id
                    }
                })
            }

            await db.Booking.update({
                state_id:3,
                occupancy:totalOccupancy
            },{
                where:{
                    id:idBooking
                }
            })

            res.redirect("/admin/menu")
        }
    },
    eliminarReserva: async(req,res)=>{
        let idBooking = req.params.idBooking

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

        res.redirect("/admin/menu")
    },
    cargarBusquedaReservas: async(req,res)=>{
        res.render("admin/adminBusquedaReservas")
    },
    resultadosBusqueda: async(req,res)=>{
        let codigo = req.query.codigo
        let apellido = req.query.apellido
        let mail = req.query.mail
        let tel = req.query.tel
        let checkIn = req.query.check_in
        let checkOut = req.query.check_out
        let personas = req.query.people
        let qHab = req.query.rooms
        
        if(!checkIn){checkIn = new Date(1900,1,1)}
        if(!checkOut){checkOut = new Date(2099,1,1)}

        let resultados = await db.Booking.findAll({
            include:['guests','states'],
            where:{
                booking_code:{[Op.like]: '%' + codigo + '%'},
                booking_code:{[Op.like]: '%' + codigo + '%'},
                check_in:{[Op.gte]: checkIn},
                check_out:{[Op.lte]: checkOut},
                occupancy:{[Op.like]: '%' + personas + '%'},
                room_count:{[Op.like]: '%' + qHab + '%'},
                '$guests.lastname$':{[Op.like]: '%' + apellido + '%'},
                '$guests.email$':{[Op.like]: '%' + mail + '%'},
                '$guests.phone$':{[Op.like]: '%' + tel + '%'},
            },
            paranoid: false
        })

        for(const booking of resultados){
            booking.totalFormateado = func.conversorNumero(booking.amount)
            booking.senaFormateado = func.conversorNumero(booking.downpayment)
            booking.checkInFormateado = func.fechaATextoMesCortado(booking.check_in)
            booking.checkOutFormateado = func.fechaATextoMesCortado(booking.check_out)
        }

        res.render("admin/adminBookingsList", {bookingsLista:resultados, linkVuelta:"/admin/buscarReservas"})
    },
    cargarOcupacion: async(req,res)=>{ 
        res.render("admin/adminDatesSearch",{
            titulo:"Ocupación",
            direccion:"/admin/reporteOcupacion",
            desde:"Desde",
            hasta:"Hasta",
            boton:"CONTINUAR"
        })
    },
    resultadosOcupacion: async(req,res)=>{ 
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("admin/adminDatesSearch",{
                titulo:"Ocupación",
                direccion:"/admin/reporteOcupacion",
                desde:"Desde",
                hasta:"Hasta",
                boton:"CONTINUAR",
                errors:errors.mapped(),
                oldInfo:req.query
            })
        }

        let cantNoches = func.cantNoches(req.query.check_in, req.query.check_out)
        let desde = func.formateoFecha(req.query.check_in)

        let fechas = []
        for (let i = 0; i<= cantNoches; i ++){
            let fecha = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i)
            fechas.push(func.fechaATextoMesCortado(fecha.getFullYear().toString() + '-' + (fecha.getMonth()+1).toString() + '-' + fecha.getDate().toString()))
        }

        let habitaciones = await db.Room.findAll()

        let infoHabitaciones = []
        for(const habitacion of habitaciones){            
            let huespedes = []
            for (let i = 0; i<= cantNoches; i ++){
                let fecha = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i)

                let huespedInfo = await db.Booking_Room.findAll({
                    include:[{
                        model:db.Booking,
                        as:'bookings',
                        include:['guests']
                    }],
                    where:{
                        room_id:habitacion.id,
                        check_in:{[Op.lte]:fecha},
                        check_out:{[Op.gte]:fecha}
                    },
                })

                let nombreHuesped
                let cantidad
                if(huespedInfo.length > 0){
                    nombreHuesped = huespedInfo[0].bookings.guests.name + ' ' + huespedInfo[0].bookings.guests.lastname
                    cantidad = Number(huespedInfo[0].adults) + Number(huespedInfo[0].children)
                }

                huespedes.push({
                    nombre:nombreHuesped,
                    cantidad: cantidad
                })    
            }

            infoHabitaciones.push({
                nro:habitacion.number,
                huespedes:huespedes
            })
        }

        let infoBusqueda ={
            textoCheckIn: func.fechaATextoCorto(req.query.check_in),
            textoCheckOut: func.fechaATextoCorto(req.query.check_out)
        }

        res.render("admin/adminReporteOcupacion",{infoHabitaciones, infoBusqueda, fechas})

    },
    cargarHuespedesDelDia: async(req,res)=>{ 
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const fecha = `${year}-${month}-${day}`;


        res.render("admin/adminHuespedesDelDia", {fecha})
    },
    resultadosHuespedesDelDia: async(req,res)=>{ 
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("admin/adminHuespedesDelDia",{errors:errors.mapped(),oldInfo:req.query})
        }

        let fecha = func.formateoFecha(req.query.fecha)

        let habitaciones = await db.Room.findAll()

        let infoHabitaciones = []
        for(const habitacion of habitaciones){            
            let huespedInfo = await db.Booking_Room.findAll({
                include:[{
                    model:db.Booking,
                    as:'bookings',
                    include:['guests']
                }],
                where:{
                    room_id:habitacion.id,
                    check_in:{[Op.lte]:fecha},
                    check_out:{[Op.gte]:fecha}
                },
            })

            let nombreHuesped
            let cantidad
            if(huespedInfo.length > 0){
                nombreHuesped = huespedInfo[0].bookings.guests.name + ' ' + huespedInfo[0].bookings.guests.lastname
                cantidad = Number(huespedInfo[0].adults) + Number(huespedInfo[0].children)
            }
            
            infoHabitaciones.push({
                nro:habitacion.number,
                huesped:nombreHuesped,
                cantidad: cantidad
            })
        }

        let infoBusqueda ={
            textoCheckIn: func.fechaATextoCorto(req.query.fecha),
        }

        res.render("admin/adminListaHuespedes",{infoHabitaciones, infoBusqueda})

    },
    cargarFechasReservar: async(req,res)=>{ 
        res.render("admin/adminDatesSearch",{
            titulo:"Reservar",
            direccion:"/admin/reservarHabitacion",
            desde:"Check in",
            hasta:"Check Out",
            boton:"Consultar"
        })
    },
    cargarReservarHabitacion:async(req,res)=>{ 
        let errors = validationResult(req)

        if (!errors.isEmpty()){
            return res.render("admin/adminDatesSearch",{
                titulo:"Reservar",
                direccion:"/admin/reservarHabitacion",
                desde:"Check in",
                hasta:"Check Out",
                boton:"Consultar",
                errors:errors.mapped(),
                oldInfo:req.query
            })
        }

        let checkIn = req.query.check_in
        let checkOut = req.query.check_out

        let infoTemp = await db.Temp.create({
            check_in:checkIn,
            check_out:checkOut,
            occupancy:1,
            rooms:1
        })
        
        req.session.idTemp = infoTemp.id
        
        let infoBusqueda ={
            checkIn: req.query.check_in,
            checkOut: req.query.check_out,
            textoCheckIn: func.fechaATextoCorto(req.query.check_in),
            textoCheckOut: func.fechaATextoCorto(req.query.check_out)
        }
        
        let tipos = await func.habitacionesLibresExt(checkIn, checkOut)
        
        if (tipos.length==0){
            return res.render("booking/bookingError")
        }

        res.render("admin/adminReservarHabitacion",{tipos, infoBusqueda})
    },
    procesoReservaHabitacion:async(req,res)=>{ 
        let errors = validationResult(req)

        let idTemp = req.session.idTemp
        let infoTemp = await db.Temp.findByPk(idTemp)

        if (!errors.isEmpty()){  
            let checkIn = infoTemp.check_in
            let checkOut = infoTemp.check_out

            let infoBusqueda ={
                checkIn: checkIn,
                checkOut: checkOut,
                textoCheckIn: func.fechaATextoCorto(checkIn),
                textoCheckOut: func.fechaATextoCorto(checkOut)
            }
        
            let tipos = await func.habitacionesLibresExt(checkIn, checkOut)

            if (tipos.length==0){
                return res.render("booking/bookingError")
            }

            return res.render("admin/adminReservarHabitacion",{tipos, infoBusqueda,errors:errors.mapped(),oldInfo:req.body})
        }

        let checkIn = infoTemp.check_in 
        let checkOut = infoTemp.check_out
        let cantNoches = func.cantNoches(infoTemp.check_in, infoTemp.check_out)
        let adultos = req.body.adults
        let menores = req.body.children
        let people = Number(adultos) + Number(menores)
        let nombre = req.body.name
        let lastname = req.body.lastname
        let cuarto = req.body.habitacion

        infoHabitacion = await db.Room.findByPk(cuarto)

        db.Guest.create({
            name:nombre,
            lastname:lastname,
            email:"solar@solardelacosta.com",
            phone:54902804200010
        }).then(async guest =>{
            let booking = await db.Booking.create({
                    check_in:checkIn,
                    check_out:checkOut,
                    nights:cantNoches,
                    occupancy:people,
                    room_count:1,
                    downpayment: 0,
                    payment:"noPayment.png",
                    amount: 0,
                    temp_id:idTemp,
                    guest_id:guest.id,
                    state_id:3
            })
            
            await db.Booking.update({
                booking_code:"HSC" + String(booking.id).padStart(5,"0")
            },{
                where:{
                    id:booking.id
                }
            })
            
            await db.Booking_Room.create({
                check_in:checkIn,
                check_out:checkOut,
                adults:adultos,
                children:menores,
                booking_id:booking.id,
                room_type_id:infoHabitacion.room_type_id,
                room_id:cuarto
            })
                        
            res.redirect("/admin/menu")
        }).then()

    }
}   

module.exports = controller