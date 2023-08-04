const router = require('express').Router();

const homeController = require('./src/controllers/homeController');
const userController = require('./src/controllers/userController');
const publicationController = require('./src/controllers/publicationController');


router.use('/', homeController);

router.use('/auth', userController);

router.use('/publication', publicationController);


module.exports = router;
