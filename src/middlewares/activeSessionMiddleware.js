function activeSessionMiddleware(req,res,next){
    if (!(req.session.idTemp || req.session.booking)){ 
        return res.redirect ('/error/session')
    }
    next()
}

module.exports = activeSessionMiddleware