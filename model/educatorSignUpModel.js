const mongoose = require("mongoose");

const userSchema = mongoose.Schema;

const educatorSignUpModel = new userSchema({
  educatorSignUpFullName: { type:String,require:true},
  educatorSignUpEmail:{ type:String,require:true},
  educatorSignUpMobileNo:{ type:Number,require:true},
  educatorSignUpPassword:{ type:String,require:true},
  educatorSignUpConfirmPassword:{ type:String,require:true},
});

module.exports = mongoose.model("educatorSignUp",educatorSignUpModel);
