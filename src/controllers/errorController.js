const controller = {
    sessionError: async(req, res)=>{
        res.render("error/errorSession", {error:req.__('errores.tiempo_agotado')})
    },
    adminError: async(req, res)=>{
        res.render("error/errorAdmin", {error:req.__('errores.tiempo_agotado')})
    }
}

module.exports = controller