const express = require('express');
const router = express.Router();
const { Event } = require('../models/event');
const { User } = require('../models/user');
const cloudinary = require('../utils/cloudinary');
const uploadOptions = require('../utils/multer');
const { Course } = require('../models/course');
const moment = require('moment');


// Helper function to parse date and time strings
const parseDateTime = (dateStr, timeStr) => {
  const dateTime = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm');
  if (!dateTime.isValid()) {
    throw new Error('Invalid date or time format.');
  }
  return dateTime.toDate();
};

router.post('/', uploadOptions.array('images', 10), async (req, res) => {
  const files = req.files;

  try {
    const { name, dateStart, timeStart, dateEnd, timeEnd, location, description, userId, userName, organization } = req.body;

    // Validate required fields
    if (!name || !dateStart || !timeStart || !dateEnd || !timeEnd || !location || !description || !userId || !userName || !organization) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Parse date and time inputs
    const startDateTime = parseDateTime(dateStart, timeStart);
    const endDateTime = parseDateTime(dateEnd, timeEnd);

    // Create event object
    const event = new Event({
      name,
      dateStart: startDateTime,
      dateEnd: endDateTime,
      location,
      description,
      userId,
      userName,
      organization,
    });

    // Save the event to the database
    const savedEvent = await event.save();
    if (!savedEvent) {
      return res.status(500).json({ success: false, message: 'The event cannot be created.' });
    }

    res.status(201).json({ success: true, event: savedEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'An error occurred while creating the event.', error: error.message });
  }
});


// GET all events
router.get('/', async (req, res) => {
    try {
      const events = await Event.find().sort({ dateStart: -1 });
      res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  });

// Helper function to fetch a single event
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT route to update an event
router.put('/:id', uploadOptions.array('images', 10), async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Handle image uploads if new images are provided
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(fileStr, {
          resource_type: 'auto',
          public_id: `event-images/${Date.now()}-${file.originalname}`,
        });
        newImageUrls.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    // Combine existing images with new ones
    const updatedImages = [...event.images, ...newImageUrls];

    // Parse date and time inputs
    const dateStart = parseDateTime(req.body.dateStart, req.body.timeStart);
    const dateEnd = parseDateTime(req.body.dateEnd, req.body.timeEnd);

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        name: req.body.name,
        dateStart,
        dateEnd,
        location: req.body.location,
        description: req.body.description,
        images: updatedImages,
        organization: req.body.organization,
      },
      { new: true }
    );

    res.status(200).json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

module.exports = router;
