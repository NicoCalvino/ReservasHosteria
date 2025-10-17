module.exports=function(sequelize, DataTypes){
    const Bank_Information = sequelize.define("Bank_Information",{
        id:{
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull:false
        },
        cbu:{
            type:DataTypes.STRING(22),
            allowNull:false
        },
        alias:{
            type:DataTypes.STRING(50),
            allowNull:false
        },
        cuit:{
            type:DataTypes.STRING(50),
            allowNull:false
        },
        nombre:{
            type:DataTypes.STRING(50),
            allowNull:false
        },
        banco:{
            type:DataTypes.STRING(50),
            allowNull:false
        }
    },{
        tableName:"banks_information",
        timestamps:false,
    })

    return Bank_Information
}