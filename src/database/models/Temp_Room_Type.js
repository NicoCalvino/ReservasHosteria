module.exports=function(sequelize, DataTypes){
    const Temp_Room_Type = sequelize.define("Temp_Room_Type",{
        id:{
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull:false
        },
        idTemp:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,  
        },
        room_type_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,  
        },
        quantity:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,  
        }
    },{
        tableName:"temp_room_types",
        timestamps:false,
    })

    return Temp_Room_Type
}