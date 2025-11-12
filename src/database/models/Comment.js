module.exports=function(sequelize, DataTypes){
    const Comment = sequelize.define("Comment",{
        id:{
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull:false
        },
        comment:{
            type:DataTypes.STRING(300),
            allowNull:false
        },
        date:{
            type:DataTypes.DATE,
            default:null
        },
        state_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true,    
        },
        booking_id:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:false,
            foreignkey:true,    
        }
    },{
        tableName:"comments",
        timestamps:false,
    })

    Comment.associate = function(models){
        Comment.belongsTo(models.Booking,{
            as:'bookings',
            foreignKey:'booking_id'
        }),
        Comment.belongsTo(models.State,{
            as:'states',
            foreignKey:'state_id'
        })
    }

    return Comment
}