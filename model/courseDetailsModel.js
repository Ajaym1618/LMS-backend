const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CourseDetailsSchema = new Schema({
  
  courseId:{type: mongoose.Schema.Types.ObjectId, required: true,},
  educatorName :{type:String,require:true},
  courseTitle:{type:String,require:true},
  courseDescription:{type:String,require:true},
  courseCategory:{type:String,require:true},
  courseVideo:{type:String,require:true},
  courseImage:{type:String,require:true},
  timeStamp:{type: Date, required:false}
});

module.exports = mongoose.model('courseDetails', CourseDetailsSchema);