module.exports=function(sequelize, DataTypes){
    const Booking_Room = sequelize.define("Booking_Room",{
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
        adults:{
            type:DataTypes.INTEGER.UNSIGNED, 
            allowNull:false
        },
        children:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false
        },
        booking_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true,    
        },
        room_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true,    
        }
    },{
        tableName:"booking_rooms",
        timestamps:false,
    })

    return Booking_Room
}