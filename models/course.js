const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },  // Simple string field for department
  organization: { type: String, required: true },  // Simple string field for organization
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
