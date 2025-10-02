module.exports=function(sequelize, DataTypes){
    const Booking = sequelize.define("Booking",{
        id:{
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull:false
        },
        check_in:{
            type:DataTypes.DATE,
            default:null
        },
        check_out:{
            type:DataTypes.DATE,
            default:null
        },
        occupancy:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,  
        },
        guest_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true,    
        },
        state_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true,    
        }
    },{
        createdAt:"created_at",
        updatedAt:"updated_at",
        deletedAt:"deleted_at",
        tableName:"bookings",
        paranoid: true
    })

    Booking.associate = function(models){
        Booking.belongsTo(models.State,{
            as:'states',
            foreignKey:'state_id'
        }),
        Booking.belongsTo(models.Guest,{
            as:'guests',
            foreignKey:'guest_id'
        }),
        Booking.belongsToMany(models.Room,{
            as:'rooms',
            through:'booking_rooms',
            foreignKey:'booking_id',
            otherKey:'room_id',
            timestamps:false
        })
    }
    return Booking
}