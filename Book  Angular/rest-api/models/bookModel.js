const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
        required: true,
    },
    type:{
        type: String,
        required: true,
    },
    userId: {
        type: ObjectId,
        ref: "User"
    }
   
}, { timestamps: { createdAt: 'created_at' } });

bookSchema.path('imageUrl').validate(function(imageUrl) {
    return imageUrl.startsWith('http');
}, 'Image url should be a link');

module.exports = mongoose.model('Book', bookSchema);
