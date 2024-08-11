const mongoose = require('mongoose')

const userSchema = mongoose.Schema;

const userSignUpModel = new userSchema({
    userSignUpFullName: {type:String,require:true},
    userSignUpEmail: {type:String,require:true},
    userSignUpPassword: {type:String,require:true},
    userSignUpConfirmPassword: {type:String,require:true},
})

module.exports = mongoose.model("userSignUp",userSignUpModel);
