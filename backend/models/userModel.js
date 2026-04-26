const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userSchema = new schema ({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    profilepic:{
        type:String,
        required:false
    }
});

module.exports = mongoose.model('user',userSchema);