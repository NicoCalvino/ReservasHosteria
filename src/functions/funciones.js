const path = require ("path")
const fs = require("fs")
const bcryptjs = require("bcryptjs")
const db = require('../database/models')
const Op = db.Sequelize.Op

const model = {
    mesActual: function(){
        let diaDeHoy = new Date()
        return this.nombreMes(diaDeHoy.getMonth()+1)
    },
    nombreMes: function(nro){
        switch (nro){
            case 1:
                return "Enero"
            case 2:
                return "Febrero"
            case 3:
                return "Marzo"
            case 4:
                return "Abril"
            case 5:
                return "Mayo"
            case 6:
                return "Junio"
            case 7:
                return "Julio"
            case 8:
                return "Agosto"
            case 9:
                return "Septiembre"
            case 10:
                return "Octubre"
            case 11:
                return "Noviembre"
            case 12:
                return "Diciembre"
            }
    },
    nroMes: function(nombre){
        switch (nombre){
            case "Enero":
                return 1
            case "Febrero":
                return 2
            case "Marzo":
                return 3
            case "Abril":
                return 4
            case "Mayo":
                return 5
            case "Junio":
                return 6
            case "Julio":
                return 7
            case "Agosto":
                return 8
            case "Septiembre":
                return 9
            case "Octubre":
                return 10
            case "Noviembre":
                return 11
            case "Diciembre":
                return 12
            }
    },
    formateoFecha: function(fecha){
        let dataSeparada = fecha.split("-")
        return new Date(dataSeparada[0],dataSeparada[1]-1,dataSeparada[2])
    },
    fechaATexto: function(fechaString){
        let infoSeccionada = fechaString.split("-")
        let cadena = Number(infoSeccionada[2]) + " de " + this.nombreMes(Number(infoSeccionada[1])) + " de " + infoSeccionada[0]

        return cadena
    },
    fechaATextoCorto: function(fechaString){
        let infoSeccionada = fechaString.split("-")
        let cadena = Number(infoSeccionada[2]) + " de " + this.nombreMes(Number(infoSeccionada[1]))

        return cadena
    },
    fechaATextoMesCortado: function(fecha){
        let fechaSeparada = fecha.split("-")
        let mes = this.nombreMes(Number(fechaSeparada[1]))

        let final = fechaSeparada[2] + " de " + mes.slice(0,3)

        return final
    },
    diasDeSemana: function(){
        let diasSemana = ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"]
        return diasSemana
    },
    cantNoches:function(checkIn, checkOut){
        let fechaIngreso = this.formateoFecha(checkIn)
        let fechaSalida = this.formateoFecha(checkOut)

        let dias = (fechaSalida - fechaIngreso)/ (1000 * 3600 * 24)
        return dias
    },
    conversorNumero: function(monto){
        let cero = String(monto)
        let primera = cero.split(".")
        largoNumero = primera[0].length
        
        let medidor=0
        let numeroConvertido = ""
        for(let i = largoNumero-1; i>=0; i--){
            medidor = medidor+1

            numeroConvertido = String(primera[0][i]) + numeroConvertido
            if(medidor==3 && i > 0){
                numeroConvertido = "." + numeroConvertido
                medidor = 0
            }
        }
        
        if(primera[1]==undefined){primera[1] = "00"}

        /* let nroFinal = numeroConvertido + "," + primera[1] */
        let nroFinal = numeroConvertido
        return nroFinal
    },
    habitacionesLibres: async (checkIn, checkOut)=>{
        let habHotel = await db.Room_Type.findAll()
        
        let tiposHab =[]
        for(const tipo of habHotel){
            let disponibles = await model.disponibilidadTipo(checkIn, checkOut, tipo)

            if(disponibles > 0){
                tipo.cantidad = disponibles
                tipo.precioForm = model.conversorNumero(tipo.price)
                tiposHab.push(tipo)
            }
        }

        return tiposHab
    },
    habitacionesLibresExt: async (checkIn, checkOut)=>{
        let habHotel = await db.Room_Type.findAll()

        let tiposHab =[]
        for(const tipo of habHotel){
            let disponibles = await model.disponibilidadTipo(checkIn, checkOut, tipo)
            
            if(disponibles > 0){
                tipo.cantidad = disponibles
                tipo.precioForm = model.conversorNumero(tipo.price)
                tipo.habDisp = await model.disponiblesPorTipo(checkIn, checkOut, tipo)
                tipo.pendientesAsignacion = await model.sinAsignarPorTipo(checkIn, checkOut, tipo)
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

    },
    disponiblesPorTipo: async(checkIn, checkOut, tipo)=>{
        let cuartosTipo = await db.Room.findAll({
            where:{
                available:true,
                room_type_id:tipo.id
            }
        })

        let cuartosDisponibles = []

        for(const cuarto of cuartosTipo){
            /*Bookings que empiezan antes*/
            let bookingsAntes = await db.Booking_Room.count({
                where:{
                    check_in:{
                        [Op.lte]:checkIn,
                    },
                    check_out:{
                        [Op.between]:[checkIn, checkOut]
                    },
                    room_id:cuarto.id
                }
            })

            /*Bookings que empiezan despues*/
            let bookingsDespues = await db.Booking_Room.count({
                where:{
                    check_in:{
                        [Op.between]:[checkIn, checkOut]
                    },
                    room_id:cuarto.id
                }
            })

            if((bookingsAntes + bookingsDespues) == 0){cuartosDisponibles.push(cuarto)}
        }
        
        return cuartosDisponibles

    },
    sinAsignarPorTipo: async(checkIn, checkOut, tipo)=>{
        
        /*Bookings que empiezan antes*/
        let bookingsAntes = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.lte]:checkIn,
                },
                check_out:{
                    [Op.between]:[checkIn, checkOut]
                },
                room_type_id:tipo.id,
                room_id:null
            }
        })

        /*Bookings que empiezan despues*/
        let bookingsDespues = await db.Booking_Room.count({
            where:{
                check_in:{
                    [Op.between]:[checkIn, checkOut]
                },
                room_type_id:tipo.id,
                room_id:null
            }
        })

        let pendientes = bookingsAntes + bookingsDespues

        return pendientes

    },
}

module.exports = model