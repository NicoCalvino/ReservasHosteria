module.exports=function(sequelize, DataTypes){
    const Room_Type = sequelize.define("Room_Type",{
        id: {
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        room_name:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        short_name:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        description:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        occupancy:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        price:{
            type:DataTypes.DECIMAL(10,2).UNSIGNED,
            allowNull:false
        },
        picture:{
            type:DataTypes.STRING(100),
            allowNull:false
        }
    },{
        timestamps:false,
        tableName:"room_types"
    })

    Room_Type.associate = function(models){
        Room_Type.hasMany(models.Room, {
            as:'rooms',
            foreignKey:'room_type_id'
        }),
        Room_Type.hasMany(models.Temp_Room_Type, {
            as:'temp_rooms',
            foreignKey:'room_type_id'
        }),
        Room_Type.belongsToMany(models.Booking,{
            as:'bookings',
            through:'booking_rooms',
            foreignKey:'room_type_id',
            otherKey:'booking_id',
            timestamps:false
        })
    }

    return Room_Type
}