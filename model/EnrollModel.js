const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EnrollSchema = new Schema({
    EnrollId:{type: mongoose.Schema.Types.ObjectId, required: true,},
    ParCourId:{type: mongoose.Schema.Types.ObjectId, required: true,},
    EnrollUserFullName: {type:String,require:true},
    EnrollUserEmail: {type:String,require:true},
})

module.exports = mongoose.model('EnrollData', EnrollSchema);