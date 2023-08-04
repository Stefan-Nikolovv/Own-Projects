const express = require("express");

const cors = require('cors');

const app = express();

const bodyParser = require('body-parser');



const router = require("./router");



app.use(cors({
  origin: '*'
}));

app.use(cors({
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
}));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json())




app.use(router);





app.listen(3000, () => {
  console.log("neshto si");
});
