module.exports=function(sequelize, DataTypes){
    const Room_Type = sequelize.define("Room_Type",{
        id: {
            type:DataTypes.INTEGER.UNSIGNED,
            autoincrement: true,
            primaryKey: true,
            allowNull: false
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
        }
    },{
        timestamps:false,
        tableName:"room_types"
    })

    Room_Type.associate = function(models){
        Room_Type.hasMany(models.Room, {
            as:'rooms',
            foreignKey:'room_type_id'
        })
    }

    return Room_Type
}