module.exports=function(sequelize, DataTypes){
    const Room = sequelize.define("Room",{
        id: {
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        number:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,   
        },
        floor:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,   
        },
        available:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
        },
        room_type_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true, 
        }
    },{
        timestamps:false,
        tableName:"rooms"
    })

    Room.associate = function(models){
        Room.belongsTo(models.Room_Type, {
            as:'room_types',
            foreignKey:'room_type_id'
        }),
        Room.belongsToMany(models.Booking,{
            as:'bookings',
            through:'booking_rooms',
            foreignKey:'room_id',
            otherKey:'booking_id',
            timestamps:false
        })
    }

    return Room
}