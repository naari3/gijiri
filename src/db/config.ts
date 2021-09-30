import { Dialect, Sequelize } from 'sequelize';

// const dbName = process.env.DB_NAME as string;
// const dbUser = process.env.DB_USER as string;
// const dbHost = process.env.DB_HOST;
// const dbDriver = process.env.DB_DRIVER as Dialect;
// const dbPassword = process.env.DB_PASSWORD;

const dbName = 'gijiri' as string;
const dbUser = 'gijiri' as string;
const dbHost = 'localhost';
const dbDriver = 'sqlite' as Dialect;
const dbPassword = 'gijiri';
const dbStorage = 'database.sqlite';

const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDriver,
  storage: dbStorage,
  logging: false,
});

export default sequelizeConnection;
