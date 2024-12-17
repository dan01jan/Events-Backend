const mongoose = require('mongoose');
const Course = require('./course'); // Import the Course model

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Course model
        ref: 'Course', // Specify the model that this field is referencing
        required: false,
    },
    organization: {
        type: String, // The user's organization
        required: false, 
    },
    other: {
        type: [String], // Array of strings
        enum: ["Lord Ikaw na bahala", "Makakapasa this Sem", "Keri pa bes"], // Predefined values
        default: [] // Default is an empty array
    },
    isAdmin: {
        type: Boolean,
        default: false,
    }
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
