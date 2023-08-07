const router = require('express').Router();

const publicationSerivce = require('../services/publicationSerivce');



router.get('/catalog/bags', async(req, res) => {
const offset = {...req.query};
    console.log(offset.offset);
    try {
        const bags = await publicationSerivce.getAllBags(offset.offset);
        
        res.send(bags);
    } catch (error) {
        res.status(404).json(error)
    }
});

router.get('/catalog/watches', async(req, res) => {
    try {
        const watches = await publicationSerivce.getAllWatches();
        console.log(watches)
        res.send(watches);
    } catch (error) {
        res.status(404).json(error)
    }
});

router.get('/catalog/shoes', async(req, res) => {
    try {
        const shoes = await publicationSerivce.getAllShoes();
        
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




router.get('/edit/:id', async(req, res) => {
    const _id = {...req.params};
    try {
        const publication = await publicationSerivce.getOnePublication(_id.id);

        console.log(publication, 'edit GET')

        res.status(200).send(publication);
    } catch (error) {
        res.status(404).json(error)
    };

});


router.get('/details/:id', async(req, res) => {
   
    const _id = {...req.params};
    try {
        const publication = await publicationSerivce.getOnePublication(_id.id);
        
        
       res.status(200).send(publication);
    } catch (error) {
        res.status(404).json(error);
    }

});
router.get('/delete/:id', async(req, res) => {
    const _id = {...req.params};
    try {
        const publication = await publicationSerivce.deleteOne(_id.id);
        const personalDeitals = await publicationSerivce.removePersonalDetails(_id.id);
        res.status(204).json({publication, personalDeitals});
    } catch (error) {
        res.status(404).json(error);
    };
});

router.get('/search', async(req, res) => {
   
    try {
        const publication = await publicationSerivce.getAll();
  
        res.status(200).json(publication);
    } catch (error) {
        res.status(404).json(error);
    };
});






module.exports = router;