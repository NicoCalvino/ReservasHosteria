function guestMiddleware(req,res,next){
    if (!req.session.user_logged){
        return res.redirect ('https://www.solardelacosta.com/')
    }
    next()
}

module.exports = guestMiddleware