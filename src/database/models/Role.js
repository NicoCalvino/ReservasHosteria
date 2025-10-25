module.exports=function(sequelize, DataTypes){
    const Role = sequelize.define("Role",{
        id: {
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        role_name:{
            type:DataTypes.STRING(10),
            allowNull:false
        }
    },{
        timestamps:false,
        tableName:"roles"
    })

    Role.associate = function(models){
        Role.hasMany(models.User,{
            as:'users',
            foreignKey:'role_id'
        })    
    }

    return Role
}