const { User } = require('../models/user');
const Course = require('../models/course'); // Import Course model
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const client = new OAuth2(process.env.GOOGLE_CLIENT_ID); // Use environment variable for security

// Middleware to validate "other" field
const validateOtherField = (value) => {
    const allowedValues = ["Lord Ikaw na bahala", "Makakapasa this Sem", "Keri pa bes"];
    return !value || allowedValues.includes(value);
};

// Get all users with course details
router.get('/', async (req, res) => {
    try {
        const userList = await User.find()
            .populate({
                path: 'course',
                populate: [{ path: 'department' }, { path: 'organization' }]
            })
            .select('-passwordHash');
        res.status(200).json(userList);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('course').select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Google login
router.post('/google_login', async (req, res) => {
    try {
        const { tokenId } = req.body;

        const verify = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email_verified, email, name } = verify.payload;

        if (!email_verified) {
            return res.status(400).json({ message: "Email verification failed" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // New user, initialize with null course
            user = new User({
                name,
                email,
                course: null,
                other: [],
            });
            await user.save();
        } else if (!user.name) {
            // Update missing name if not already set
            user.name = name;
            await user.save();
        }

        const isProfileComplete = user.course !== null; // Profile is incomplete if course is null

        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_TIME }
        );

        res.status(200).json({
            message: 'Login successful',
            user,
            token,
            isProfileComplete,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Update user data
router.put('/:id', async (req, res) => {
    try {
        const { name, email, course, other } = req.body;

        // Validate optional "other" field
        if (other && !validateOtherField(other)) {
            return res.status(400).json({ message: "Invalid value for 'other' field." });
        }

        // Prepare update fields
        const updateData = {
            name,
            email,
            other: other || [] // Default to empty array if 'other' is not provided
        };

        // If course ID is provided, validate it and populate it
        if (course) {
            if (!mongoose.Types.ObjectId.isValid(course)) {
                return res.status(400).json({ message: "Invalid course ID." });
            }

            const courseData = await Course.findById(course);
            if (!courseData) {
                return res.status(404).json({ message: "Course not found." });
            }

            updateData.course = courseData._id; // Save only the course ID
        }

        // Find and update the user
        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('course'); // Populate the course field after update

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndRemove(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// Get user count
router.get('/get/count', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.status(200).json({ userCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user count', error: error.message });
    }
});

// Get the currently logged-in user's data without middleware
// router.get('/me', async (req, res) => {
//     try {
//       const token = req.header('Authorization')?.replace('Bearer ', ''); // Get token from Authorization header
  
//       if (!token) {
//         return res.status(400).json({ message: 'Token is required.' });
//       }
  
//       const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
//       const userId = decoded.userId; // Extract the userId from the token
  
//       const user = await User.findById(userId).populate({
//         path: 'course',
//         populate: [{ path: 'department' }, { path: 'organization' }],
//       });
  
//       if (!user) {
//         return res.status(404).json({ message: 'User not found.' });
//       }
  
//       res.status(200).json(user); // Return the full user object
//     } catch (error) {
//       res.status(500).json({ message: 'Error fetching user data', error: error.message });
//     }
//   });
router.get('/me', async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
  
      if (!token) {
        return res.status(400).json({ message: 'Authorization token is required.' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      const user = await User.findById(userId).select('name'); // Only retrieve `name`
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      res.status(200).json({ name: user.name }); // Only send necessary data
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

router.get('/google_details', async (req, res) => {
    try {
        const tokenId = req.header('Authorization')?.replace('Bearer ', ''); // Get token from Authorization header

        if (!tokenId) {
            return res.status(400).json({ message: 'Token is required.' });
        }

        // Verify the token ID with Google
        const verify = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID, // Ensure the token matches the client ID
        });

        const { email_verified, email, name } = verify.payload;

        if (!email_verified) {
            return res.status(400).json({ message: 'Email verification failed' });
        }

        // Log the user's name to the terminal
        console.log(`Logged-in user: ${name}`);

        // Respond with token details and user information
        res.status(200).json({
            tokenId,
            email,
            name,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error retrieving Google login details', error: error.message });
    }
});


module.exports = router;
