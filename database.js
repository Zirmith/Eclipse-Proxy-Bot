const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'proxies.sqlite', // SQLite database file
});

const Proxy = sequelize.define('Proxy', {
  protocol: DataTypes.STRING,
  ip: DataTypes.STRING,
  port: DataTypes.INTEGER,
  country: DataTypes.STRING,
  lastUpdated: DataTypes.DATE,
});

(async () => {
  await sequelize.sync();
  console.log('Database is ready');
})();

module.exports = { Proxy };
