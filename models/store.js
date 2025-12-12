// src/models/store.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Store = sequelize.define(
  "Store",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ratings_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "stores",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Store;
