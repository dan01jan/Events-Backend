const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dateStart: {
        type: Date,
        required: true
    },
    dateEnd: {
        type: Date,
        required: true
    },
    images: [{
        type: String
    }],
    feedback: [
        {
            user: {
                type: String,
                required: true
            },
            comment: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

exports.Event = mongoose.model('Event', eventSchema);
