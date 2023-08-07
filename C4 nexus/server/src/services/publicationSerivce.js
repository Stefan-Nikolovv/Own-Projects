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
  console.log(offsetItem)
  return await postgreSQL.from("bags").limit(5).offset(offsetItem)
};
exports.getAllWatches = async () => {
  return await postgreSQL.select("*").from("watches");
};
exports.getAllShoes = async () => {
  return await postgreSQL.select("*").from("shoes");
};

exports.getAllbyColor = async (color, database) => {
  return await postgreSQL.select("*").returning("*").from(database).where({color})
}

exports.createPublication = async (
  brand,
  model,
  year,
  imageurl,
  price,
  description,
  _ownerid
) => {
  return await postgreSQL("cars").returning("*").insert({
    brand,
    model,
    year,
    imageurl,
    price,
    description,
    _ownerid,
  });
};

exports.getOnePublication = async (_carid) => {
  // return await postgreSQL.select("*").from('cars').where({_carid});
  return await postgreSQL.from('cars').returning("*").join('sellers', function() {
    this.on('cars._carid', '=', 'sellers._sellerid')
    this.andOnVal('sellers._sellerid', '=', _carid);
  });

};

exports.edit = async (
  brand,
  model,
  year,
  imageurl,
  price,
  description,
  _carid
) => {
    
  return await postgreSQL("cars").returning("*").where({ _carid }).update({
    brand,
    model,
    year,
    imageurl,
    price,
    description,
  });
};



exports.deleteOne = async(_carid) => {
    return await postgreSQL("cars").returning("*").where({ _carid }).del()
};

exports.removePersonalDetails = async(_sellerid) => {
  return await postgreSQL("sellers").returning("*").where({ _sellerid }).del()
}


exports.createPersonalDetails = async (personalname, city, country, phonenumber, _sellerid) => {
 
return await postgreSQL("sellers").returning("*").insert({
   personalname,
    city,
     country, 
     phonenumber,
      _sellerid
  })
};

exports.updatePersonalInfo = async(personalname, city, country, phonenumber, _sellerid) => {
  return await postgreSQL("sellers").returning("*").where({ _sellerid }).update({
    personalname,
     city,
      country,
       phonenumber
  });
};

exports.getPersonalDetails = async(_sellerid) => {
  return await postgreSQL.select("*").from("sellers").where({ _sellerid });
}