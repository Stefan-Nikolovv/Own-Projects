const router = require('express').Router();


const publicationController = require('./src/controllers/publicationController');



router.use('/publication', publicationController);


module.exports = router;
