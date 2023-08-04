const knex = require("knex");
const bcrypt = require("bcrypt");
const { SECRET } = require("../config/env");
const jwt = require("jsonwebtoken");


const postgreSQL = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "123456",
    database: "rentacar",
  },
});

exports.passwordHash = async (password) => {
  return await bcrypt.hash(password, 10).then((cryptedPasword) => {
    return cryptedPasword;
  });
};

exports.createUser = async (username, password, email) => {
  return await postgreSQL("users").returning("*").insert({
    username,
    password,
    email,
  });
};

exports.createToken = (user) => {

  const payload = { _id: user._id, username: user?.username, email: user.email };

  const promise = new Promise((resolve, reject) => {
    jwt.sign(payload, SECRET, { expiresIn: "2d" }, (err, decodedToken) => {
      if (err) {
        return reject(err);
      }
      resolve(decodedToken);
    });
  });

  return promise;
};

exports.login = async (email, password) => {
  const user = await postgreSQL
    .select("*")
    .from("users")
    .where({ email })
    .then((user) => {
      return user;
    });

  if (!user[0]) {
    throw "Email or Password is not correct.";
  }
  
  const isValid = await bcrypt.compare(password, user[0].password);


  if (!isValid) {
    throw "Email or Password is not correct.";
  }
 
  return user[0];
};
