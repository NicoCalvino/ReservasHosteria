function adminSessionMiddleware(req,res,next){
    if (!(req.session.idTemp)){ 
        return res.redirect ('/error/admin')
    }
    next()
}

module.exports = adminSessionMiddleware