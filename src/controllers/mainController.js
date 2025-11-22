const controller = {
    start: async(req,res)=>{
        if(!req.cookies.lang){
            res.cookie('lang','es',{maxAge:1250000000})
        }
        res.render("search/initialSearch")
    },
    languageChange: async(req, res)=>{
        idiomaElegido = req.params.lang
        res.cookie('lang',idiomaElegido,{maxAge:1250000000})
        
        const referer = req.get('referer')
        
        res.redirect(referer)
    }
}

module.exports = controller