const { bookModel } = require('../models');
const { userModel } = require('../models')
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
function getBooks(req, res, next) {
    
       
    bookModel.find()
        .populate('userId')
        .then(books => 
            res.json(books))
        .catch(next);
}

function getBook(req, res, next) {
    const { bookId } = req.params;
        
    bookModel.find()
       
        .then((books) =>{
           
            const ownerOFBooks = books.filter(x => x._id.toString() == bookId.toString());
            console.log(ownerOFBooks)
            return res.json(ownerOFBooks)
        })
        
        .catch(next);
}

function createBook(req, res, next) {
   
    let {author, title, description, imageUrl, type } = req.body;
    const { _id: userId } = req.user;
   
    
    let fileName = '';

    if (req.body.createFile) {
        
         fileName = uuidv4();
        let filePath = `${'../static/images'}/${fileName}`;
        let buffer = Buffer.from(req.body.createFile.split(',')[1], "base64")
       
        fs.writeFileSync(path.join(__dirname, filePath), buffer);
         
    }
   
    imageUrl = `${'http://localhost:3000/public/images/'}${fileName}`
  
    bookModel.create({ author, title, description, imageUrl, type, userId })
    .then(post => {
        return Promise.all([
            userModel.updateOne({ id: userId }),
        ])
        .then(book => {
            res.status(200).json(book)
        })
         
    })
        .catch(next);
}

function getMyBooks(req, res, next) {
    const { _id: userId } = req.user;
        console.log()
    bookModel.find()
       
        .then((books) =>{
            
            const ownerOFBooks = books.filter(x => x.userId.toString() == userId.toString());
           
            return res.json(ownerOFBooks)
        })
        .catch(next);
}

function getSearchedBook(req, res, next) {
    const {  keyword: keyword } = req.body;
   const foundBooks =  bookModel.find({$or:[{author: keyword},{title:keyword}]}, function (err, books){
        if(err){
            res.send(err)
        }
        
      return  res.json(books)
    });
    
    
}

module.exports = {
    getBooks,
    createBook,
    getBook,
    getMyBooks,
    getSearchedBook
   
}
