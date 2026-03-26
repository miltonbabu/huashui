const { Sequelize } = require("sequelize");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";
const dbType =
  isProduction && process.env.DATABASE_URL ? "PostgreSQL" : "SQLite";

let sequelize;

if (isProduction && process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  console.log("📦 Using PostgreSQL database (Production)");
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "../../database.sqlite"),
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  console.log("📦 Using SQLite database (Development)");
}

module.exports = sequelize;
module.exports.dbType = dbType;
