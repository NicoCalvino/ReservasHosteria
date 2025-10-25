module.exports=function(sequelize, DataTypes){
    const User = sequelize.define("User",{
        id: {
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        user_name:{
            type:DataTypes.STRING(20),
            allowNull:false
        },
        password:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        role_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true, 
        }
    },{
        timestamps:false,
        tableName:"users"
    })

    User.associate = function(models){
        User.belongsTo(models.Role,{
            as:'roles',
            foreignKey:'role_id'
        })    
    }

    return User
}