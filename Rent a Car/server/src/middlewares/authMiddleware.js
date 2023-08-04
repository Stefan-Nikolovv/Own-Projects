

const jwt = require('jsonwebtoken');

const { SECRET } = require('../config/env');

exports.getUser = (req, res, next) => {
    const token = req.cookies['user'];
    
    if(token) {
        jwt.verify(token, SECRET, ((err, verifyUser) => {
            if(err) {
                res.clearCookie('user');
            }
            req.user = verifyUser;
            res.locals.user = verifyUser;
            next();
        }));
    }else{
        next();
    }
};