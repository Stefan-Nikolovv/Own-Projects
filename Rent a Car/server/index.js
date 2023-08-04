const express = require("express");

const cors = require('cors');

const app = express();

const bodyParser = require('body-parser');

const cookieParser = require("cookie-parser");

const router = require("./router");

const { getUser } = require('./src/middlewares/authMiddleware');

app.use(cors({
  origin: '*'
}));

app.use(cors({
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
}));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json())

app.use(cookieParser());

app.use(getUser);

app.use(router);





app.listen(3000, () => {
  console.log("neshto si");
});
