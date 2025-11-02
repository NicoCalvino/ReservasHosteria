const db = require('../database/models')
const func = require('../functions/funciones')

async function adminLoggedMiddleware (req,res,next){
    res.locals.adminLogged = false
    res.locals.superAdmin = false

    let userInCookie = req.cookies.user_logged
    
    if(userInCookie){req.session.user_logged = userInCookie}
    
    if(req.session.user_logged){
        let infoUser = await db.User.findAll({
            where:{
                user_name:req.session.user_logged
            }
        })

        if(infoUser.length>0){
            res.locals.adminLogged = true

            let userRole = infoUser[0].role_id
            if (userRole == 2){
                res.locals.superAdmin = true
            }
        }
    }
    next()
}

module.exports = adminLoggedMiddleware
