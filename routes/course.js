// routes/courses.js
const express = require('express');
const Course = require('../models/course');  // Correct import (no destructuring)
const router = express.Router();

// Create a new course
router.post('/', async (req, res) => {
  try {
    const { name, department, organization } = req.body;

    // Validate input fields
    if (!name || !department || !organization) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Create a new course
    const course = new Course({
      name,
      department,
      organization,
    });

    // Save the course to the database
    const savedCourse = await course.save();

    // If the course couldn't be saved, return an error message
    if (!savedCourse) {
      return res.status(500).json({ success: false, message: 'The course cannot be created' });
    }

    // Return the created course as a response
    res.status(201).json({
      success: true,
      course: savedCourse,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch all courses
router.get(`/`, async (req, res) => {
  try {
    const courses = await Course.find();  // Fetch all courses from the database
    if (!courses || courses.length === 0) {
      return res.status(404).json({ success: false, message: 'No courses found' });
    }
    res.status(200).json(courses);  // Return all courses with their department and organization
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch course by courseId
router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    // Find the course by its ID
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Return the course details
    res.status(200).json(course);
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
