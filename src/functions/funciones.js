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
                return "ENERO"
            case 2:
                return "FEBRERO"
            case 3:
                return "MARZO"
            case 4:
                return "ABRIL"
            case 5:
                return "MAYO"
            case 6:
                return "JUNIO"
            case 7:
                return "JULIO"
            case 8:
                return "AGOSTO"
            case 9:
                return "SEPTIEMBRE"
            case 10:
                return "OCTUBRE"
            case 11:
                return "NOVIEMBRE"
            case 12:
                return "DICIEMBRE"
            }
    },
    nroMes: function(nombre){
        switch (nombre){
            case "ENERO":
                return 1
            case "FEBRERO":
                return 2
            case "MARZO":
                return 3
            case "ABRIL":
                return 4
            case "MAYO":
                return 5
            case "JUNIO":
                return 6
            case "JULIO":
                return 7
            case "AGOSTO":
                return 8
            case "SEPTIEMBRE":
                return 9
            case "OCTUBRE":
                return 10
            case "NOVIEMBRE":
                return 11
            case "DICIEMBRE":
                return 12
            }
    },
    formateoFecha: function(fecha){
        let dataSeparada = fecha.split("-")
        return new Date(dataSeparada[0],dataSeparada[1]-1,dataSeparada[2])
    },
    fechaATexto: function(fechaString){
        let infoSeccionada = fechaString.split("-")
        let cadena = Number(infoSeccionada[2]) + " DE " + this.nombreMes(Number(infoSeccionada[1])) + " DE " + infoSeccionada[0]

        return cadena
    },
    fechaATextoCorto: function(fechaString){
        let infoSeccionada = fechaString.split("-")
        let cadena = Number(infoSeccionada[2]) + " DE " + this.nombreMes(Number(infoSeccionada[1]))

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
    }
}

module.exports = model