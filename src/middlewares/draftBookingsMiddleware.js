const db = require('../database/models')
const func = require('../functions/funciones')

async function draftBookingsMiddleware(req,res,next){

    let draftBookings = await db.Booking.findAll({
        where:{
            state_id:1
        }
    })

    for(const booking of draftBookings){
        let fecha = new Date

        let cantNoches = (fecha - booking.created_at)/ (1000 * 3600 * 24)

        if(cantNoches > 3){
            await db.Booking.update({
                    state_id:1
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