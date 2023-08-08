const knex = require("knex");

const postgreSQL = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "123456",
    database: "c4nexus",
  },
});

exports.getAllBags = async (offsetItem) => {
  // return await postgreSQL.select("*").from("bags");
  
  return await postgreSQL.select('*').from("bags").limit(5, {skipBinding: true}).offset(Number(offsetItem)).orderBy('id')
};
exports.getAllWatches = async (offsetItem) => {
  return await postgreSQL.select('*').from("watches").limit(5, {skipBinding: true}).offset(Number(offsetItem)).orderBy('id')
};
exports.getAllShoes = async (offsetItem) => {
  return await postgreSQL.select('*').from("shoes").limit(5, {skipBinding: true}).offset(Number(offsetItem)).orderBy('id')
};

exports.getAllbyColor = async (color, database) => {
  return await postgreSQL.select("*").returning("*").from(database).where({color})
}








