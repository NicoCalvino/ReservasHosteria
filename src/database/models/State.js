module.exports=function(sequelize, DataTypes){
    const State = sequelize.define("State",{
        id: {
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        state:{
            type:DataTypes.STRING(100),
            allowNull:false
        }
    },{
        timestamps:false,
        tableName:"states"
    })

    State.associate = function(models){
        State.hasMany(models.Booking,{
            as:'bookings',
            foreignKey:'state_id'
        }),
        State.hasMany(models.Comment,{
            as:'comments',
            foreignKey:'state_id'
        })    
    }

    return State
}