const router = require('express').Router();

const publicationSerivce = require('../services/publicationSerivce');



router.get('/catalog/bags', async(req, res) => {
const offset = req.query.offset
   
    try {
        const bags = await publicationSerivce.getAllBags(offset);
     
        res.send(bags);
    } catch (error) {
        res.status(404).json(error)
    }
});

router.get('/catalog/watches', async(req, res) => {
    const offset = req.query.offset
   
    try {
        const watches = await publicationSerivce.getAllWatches(offset);
     
        res.send(watches);
    } catch (error) {
        res.status(404).json(error)
    }
});

router.get('/catalog/shoes', async(req, res) => {
    const offset = req.query.offset
   
    try {
        const shoes = await publicationSerivce.getAllShoes(offset);
     
        res.send(shoes);
    } catch (error) {
        res.status(404).json(error)
    }
});

router.get('/catalog/:color/:data', async(req, res) => {
    const color = req.params;
    


    try {
        const publication = await publicationSerivce.getAllbyColor(color.color, color.data);
      
        res.send(publication);
    } catch (error) {
        res.status(404).json(error)
    }
});








module.exports = router;