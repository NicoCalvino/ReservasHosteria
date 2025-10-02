module.exports=function(sequelize, DataTypes){
    const Temp = sequelize.define("Temp",{
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
        rooms:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,  
        }
    },{
        createdAt:"created_at",
        updatedAt:"updated_at",
        deletedAt:"deleted_at",
        tableName:"temps",
        paranoid: true
    })

    return Temp
}