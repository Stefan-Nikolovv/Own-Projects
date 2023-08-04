const router = require('express').Router();

const publicationSerivce = require('../services/publicationSerivce');



router.get('/catalog', async(req, res) => {
        try {
            const cars = await publicationSerivce.getAll();
            console.log( typeof cars)
            res.send(cars);
        } catch (error) {
            res.status(404).json(error)
        }
});

router.post('/create', async(req, res) => {
//    const user = await getUser(req, res);
   const publication = {...req.body, _ownerid: req.user?._id};
   
   try {
    const createdPublication  =  await publicationSerivce.createPublication( publication.brand,
        publication.model,
        publication.year,
        publication.imageurl,
        Number(publication.price),
        publication.description,
        publication._ownerid);
      
     const personalDeitals =   await publicationSerivce.createPersonalDetails( publication.personalName, publication.city, publication.country, publication.pNumber, createdPublication[0]._carid)

            
        

        
    res.status(200).json(createdPublication, personalDeitals);
   } catch (error) {
    res.status(404).json(error);
   };
        

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
router.post('/edit/:id', async(req, res) => {
    const publication = {...req.body};
    const _id = {...req.params};
   
    try {
        const edittedPublication = await publicationSerivce.edit( publication.brand,
            publication.model,
            publication.year,
            publication.imageurl,
            Number(publication.price),
            publication.description, _id.id);
            const personalDeitals =   await publicationSerivce.updatePersonalInfo( publication.personalName, publication.city, publication.country, publication.pNumber, _id.id)

            res.status(200).json({edittedPublication, personalDeitals})
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