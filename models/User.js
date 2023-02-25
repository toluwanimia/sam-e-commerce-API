const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type : String,
        require : [true, 'please, provide a name'],
        minlength : 3,
        maxlength : 50,
    },
    email: {
        type : String,
        require : [true, 'please, provide an Email'],
        validate: {
            validator : validator.isEmail ,
            message: 'Please, provide valid email', 
        },
        unique: true,
    },
    password : {
        type : String,
        require : [true, 'please, provide a password'],
        minlength : 6,
        maxlength : 100,
    }, 
    role: {
        type: String,
        enum: ['admin', 'user'],
        default:'user',
    }
})

// the below function hash the password
UserSchema.pre('save', async function() {
    if(!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})
// the below function compare hashed password so we dont get wrong password at login
UserSchema.methods.comparePassword = async function(candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}



module.exports = mongoose.model('User', UserSchema)