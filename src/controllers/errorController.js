const path = require("path")
const fs = require("fs")
const db = require('../database/models')

const controller = {
    sessionError: async(req, res)=>{
        res.render("error/errorSession", {error:"su tiempo se ha agotado"})
    }
}

module.exports = controller