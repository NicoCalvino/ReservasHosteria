function loggedInMiddleware(req,res,next){
    if (req.session.user_Logged){ 
        return res.redirect ('/admin/menu')
    }
    next()
}

module.exports = loggedInMiddleware