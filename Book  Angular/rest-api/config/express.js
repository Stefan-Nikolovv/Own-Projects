const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cookieSecret = process.env.COOKIESECRET || 'SoftUni';
// const { errorHandler } = require('../utils')

module.exports = (app) => {
    app.use(express.json({limit:"100mb"}));

    app.use(cookieParser(cookieSecret));
    app.use('/public', express.static('static'));
    app.use(express.static(path.resolve(__basedir, 'static')));
    app.use(express.static(path.join(__dirname, "js")));
    // app.use(errorHandler(err, req, res, next));
};
