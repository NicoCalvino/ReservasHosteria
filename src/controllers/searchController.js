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

        let tiposHab = await func.habitacionesLibres(checkIn, checkOut)
        
        if (tiposHab.length==0){
            return res.render("booking/bookingError")
        }
        
        res.render("search/roomSelection",{tiposHab, qHab, infoTemp, oldInfo:req.query})
    }
}

module.exports = controller