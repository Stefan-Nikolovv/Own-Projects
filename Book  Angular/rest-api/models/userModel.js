const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = Number(process.env.SALTROUNDS) || 5;

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
        unique: true,
        maxlength: [20, 'Fistname must be less than 20 letters.'],
    },
    lastName:{
        type: String,
        required: true,
        unique: true,
        maxlength: [20, 'Lastname must be less than 20 letters.'],
    },
    
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                
                return /(^[a-zA-Z0-9]+\.[a-zA-Z0-9]+\@[a-z]+\.[bg|com|uk]+$)/gm.test(v);
            },
            message: props => `${props.value} must be a valid E-Mail format!.`
        },
    },
   
    password: {
        type: String,
        required: true,
        minlength: [5, 'Password should be at least 5 characters'],
        validate: {
            validator: function (v) {
                
                return /[a-zA-Z0-9]+/g.test(v);
            },
            message: props => `${props.value} must contains only latin letters and digits!`
        },
    },
    books: [{
        type: ObjectId,
        ref: "Book"
    }],
    
}, { timestamps: { createdAt: 'created_at' } });

userSchema.methods = {
    matchPassword: function (password) {
        return bcrypt.compare(password, this.password);
    }
}

userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) {
                next(err);
            }
            bcrypt.hash(this.password, salt, (err, hash) => {
                if (err) {
                    next(err);
                }
                this.password = hash;
                next();
            })
        })
        return;
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
