const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  });
  
  const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    dateStart: { type: Date, required: true },
    dateEnd: { type: Date, required: true },
    location: { type: String },
    images: [imageSchema],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: String, required: true },
    userName: { type: String }
  });
  
  
  const Event = mongoose.model('Event', eventSchema);
  
  module.exports = { Event };
  

exports.Event = mongoose.model('Event', eventSchema);