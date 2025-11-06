const db = require('../database/models')
const func = require('../functions/funciones')

async function draftBookingsMiddleware(req,res,next){

    let draftBookings = await db.Booking.findAll({
        where:{
            state_id:3
        }
    })

    for(const booking of draftBookings){
        let fecha = new Date

        console.log(booking.created_at)

        cantNoches = func.cantNoches(booking.created_at, fecha)
        if(cantNoches > 3){
            await db.Booking.update({
                    state_id:4
                },{
                    where:{
                        id:booking.id
                    }
                })
        
            await db.Booking.destroy({
                where:{
                    id:booking.id
                }
            })
    
            await db.Booking_Room.destroy({
                where:{
                    booking_id:booking.id
                }
            })
        }
    }
    
    next()
}

module.exports = draftBookingsMiddleware