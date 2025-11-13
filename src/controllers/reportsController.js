const path = require("path")
const db = require('../database/models')
const func = require('../functions/funciones')
const ExcelJS = require('exceljs')
const Op = db.Sequelize.Op

let rutaBase = "reports"

const controller = {
    generateExcel: async (res, titulos, datos ,nombre) =>{
        const wb = new ExcelJS.Workbook()
        wb.creator = "user"
        wb.created = new Date()
        const ws = wb.addWorksheet(nombre)

        function correccionTitulo(titulo){
            let tituloFinal = ""
            let tituloSeparado = titulo.split("_")
            for(const palabra of tituloSeparado){
                tituloFinal = tituloFinal + " " + palabra[0].toUpperCase() + palabra.slice(1)
            }
            return tituloFinal.trim()
        }


        let titulosArchivo=[]
        for(const titulo of titulos){
            titulosArchivo.push({
                header:correccionTitulo(titulo),
                key:titulo,
                width:10
            })
        }

        ws.columns = titulosArchivo
        ws.addRows(datos)

        ws.columns.forEach((column, colIndex) =>{
            let maxLength=0
            
            ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const cellValue = row.getCell(colIndex + 1).value;
                if (cellValue) {
                    const cellText = cellValue.toString();
                    maxLength = Math.max(maxLength, cellText.length);
                }
            });

            column.width = Math.max(maxLength, column.header.length) + 4
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + nombre + '.xlsx');

        await wb.xlsx.write(res)
        res.end()
    },
    reporteOcupacion: async(req,res)=>{
        let diaHoy=new Date

        let cantNoches = func.cantNoches(req.query.check_in, req.query.check_out)
        let desde = func.formateoFecha(req.query.check_in)

        let titulos = ['habitacion_dia']
        for (let i = 0; i<= cantNoches; i ++){
            let fecha = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i)
            titulos.push(func.fechaATextoMesCortado(fecha.getFullYear().toString() + '-' + (fecha.getMonth()+1).toString() + '-' + fecha.getDate().toString()))
        }

        let habitaciones = await db.Room.findAll()

        let data = []
        for(const habitacion of habitaciones){        
            let infoHabitacion = {
                habitacion_dia:habitacion.number
            }
            for (let i = 0; i<= cantNoches; i ++){
                let fecha = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i)
                let nombreCategoria = func.fechaATextoMesCortado(fecha.getFullYear().toString() + '-' + (fecha.getMonth()+1).toString() + '-' + fecha.getDate().toString())
                
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
                    infoHabitacion[nombreCategoria] = nombreHuesped + '(x' + cantidad + ')'
                } else {
                    infoHabitacion[nombreCategoria] = ""
                }
            }

            data.push(infoHabitacion)
        }
        
        let nombreReporte = "ReporteOcupacion " + diaHoy.getDate()+"-"+(diaHoy.getMonth()+1)
        controller.generateExcel(res, titulos, data, nombreReporte)
    }
}



module.exports = controller