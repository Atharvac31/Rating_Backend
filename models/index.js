const sequelize = require('../config/db');
const User=require('./user');
const Rating=require('./rating');
const Store=require('./store');

User.hasMany(Store,{foreignKey:'owner_id',as:'stores'});
Store.belongsTo(User,{foreignKey:'owner_id',as:'owner'});
Rating.belongsTo(User,{foreignKey:'user_id',as:'user'});

Store.hasMany(Rating,{foreignKey:'store_id',as:'ratings'});
Rating.belongsTo(Store,{foreignKey:'store_id',as:'store'});

module.exports={sequelize,User,Store,Rating};