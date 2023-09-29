const express = require('express');
const router = express.Router();
const { auth } = require('../utils');
const { bookController, postController } = require('../controllers');

// middleware that is specific to this router

router.get('/', bookController.getBooks);
router.get('/mybooks', auth(), bookController.getMyBooks);
router.post('/', auth(), bookController.createBook);

router.get('/:bookId', bookController.getBook);

router.put('/:bookId', auth(), postController.editPost);
router.delete('/:bookId', auth(), postController.deletePost);

// router.get('/my-trips/:id/reservations', auth(), themeController.getReservations);

module.exports = router