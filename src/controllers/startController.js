const path = require("path")
const fs = require("fs")

const controller = {
    start: async(req,res)=>{
        res.render("reservas/busqueda")
    },
    consultar:async(req,res)=>{
        
    }
}

module.exports = controller