const router = require('express').Router();



router.get('/', async (req, res) => {
    
    res.sendStatus(200)
});

module.exports = router;