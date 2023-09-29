const { userModel, bookModel, postModel } = require('../models');

function newPost(title, description, imageUrl, type, userId, bookId) {
    console.log('title:', title , 'description:', description, imageUrl,'imageUrl',type, 'type',userId, 'userId',bookId, 'bookId')
    return postModel.create({ title, description, imageUrl, type, userId, bookId })
        .then(post => {
            return Promise.all([
                userModel.updateOne({ _id: userId }, { $addToSet: { books: bookId } }),
                bookModel.findByIdAndUpdate({ _id: bookId }, { $push: { userId: userId }}, { new: true })
            ])
           
        })
}

// function getLatestsPosts(req, res, next) {
//     const limit = Number(req.query.limit) || 0;

//     postModel.find()
//         .sort({ created_at: -1 })
//         .limit(limit)
//         .populate('themeId userId')
//         .then(posts => {
//             res.status(200).json(posts)
//         })
//         .catch(next);
// }

function createPost(req, res, next) {
    const { bookId } = req.params;
    const { _id: userId } = req.user;
    

    newPost( userId, bookId)
        .then(([_, updatedTheme]) => res.status(200).json(updatedTheme))
        .catch(next);
}

function editPost(req, res, next) {
    const { bookId } = req.params;
    const { title, description, imageUrl, type } = req.body;
    const { _id: userId } = req.user;
   
    // if the userId is not the same as this one of the post, the post will not be updated
    bookModel.findOneAndUpdate({ _id: bookId, userId }, { title, description, imageUrl, type }, { new: true })
        .then(updatedPost => {
            if (updatedPost) {
                res.status(200).json(updatedPost);
            }
            else {
                res.status(401).json({ message: `Not allowed!` });
            }
        })
        .catch(next);
}

function deletePost(req, res, next) {
    const {  bookId } = req.params;
    
    
    Promise.all([
       
        
        bookModel.findOneAndDelete({ _id: bookId }),
    ])
        .then(([deletedOne, _, __]) => {
            if (deletedOne) {
                res.status(200).json(deletedOne)
            } else {
                res.status(401).json({ message: `Not allowed!` });
            }
        })
        .catch(next);
}

function like(req, res, next) {
    const { postId } = req.params;
    const { _id: userId } = req.user;

  

    postModel.updateOne({ _id: postId }, { $addToSet: { likes: userId } }, { new: true })
        .then(() => res.status(200).json({ message: 'Liked successful!' }))
        .catch(next)
}

module.exports = {
    // getLatestsPosts,
    newPost,
    createPost,
    editPost,
    deletePost,
    like,
}
