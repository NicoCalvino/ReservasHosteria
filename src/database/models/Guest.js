module.exports=function(sequelize, DataTypes){
    const Guest = sequelize.define("Guest",{
        id:{
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull:false
        },
        name:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        lastname:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        email:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        phone:{
            type:DataTypes.STRING(100),
            allowNull:false
        }
    },{
        tableName:"guests",
        timestamps:false,
    })

    Guest.associate = function(models){
        Guest.hasMany(models.Booking,{
            as:'bookings',
            foreignKey:'guest_id'
        })   
    }
    return Guest
}