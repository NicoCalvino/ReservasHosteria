const bcryptjs = require('bcryptjs')
const db = require('../database/models')

async function userCreationMiddleware(req,res,next){

    let usuarios = [{
        user_name:'hosteriaSolar',
        password:bcryptjs.hashSync('costaLaDeSolarHosteria',10),
        role_id:1
    },{
        user_name:'superSolar',
        password:bcryptjs.hashSync('milito2014Lisandro2019',10),
        role_id:2
    }]

    for(const user of usuarios){

        let existente = await db.User.findAll({
            where:{
                user_name:user.user_name
            }
        })

        if(existente.length == 0){
            await db.User.create({
                user_name:user.user_name,
                password:bcryptjs.hashSync(user.password,10),
                role_id:user.role_id
            })
        }
    }
    
    next()
}

module.exports = userCreationMiddleware