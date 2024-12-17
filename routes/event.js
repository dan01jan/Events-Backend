const express = require('express');
const router = express.Router();
const { Event } = require('../models/event');
const { User } = require('../models/user');
const cloudinary = require('../utils/cloudinary');
const uploadOptions = require('../utils/multer');
const { Course } = require('../models/course');
const fs = require('fs');


const parseDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':'); 

  const dateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  if (isNaN(dateTime)) {
    throw new Error('Invalid date or time format.');
  }

  return dateTime;
};


router.post('/', uploadOptions.array('images', 10), async (req, res) => {
  const files = req.files;

  try {
    const { name, dateStart, timeStart, dateEnd, timeEnd, location, description, userId, userName, organization } = req.body;

    // Validate required fields
    if (!name || !dateStart || !timeStart || !dateEnd || !timeEnd || !location || !description || !userId || !userName || !organization) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    let images = [];
    if (files && files.length > 0) {
      const uploadToCloudinary = (file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'events', resource_type: 'auto' },
            (error, result) => {
              if (error) {
                console.error("Cloudinary Upload Error:", error);
                return reject(error);
              }
              resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      };
    
      const imagePromises = files.map(uploadToCloudinary);
      const cloudinaryResults = await Promise.all(imagePromises);
    
      images = cloudinaryResults.map(result => ({
        url: result.secure_url,
        publicId: result.public_id
      }));
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
      images: images
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
    let newImages = [];
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'events', resource_type: 'auto' },
            (error, result) => {
              if (error) {
                console.error("Cloudinary Upload Error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      });
      
      const cloudinaryResults = await Promise.all(imagePromises);
      newImages = cloudinaryResults.map(result => ({
        url: result.secure_url,
        publicId: result.public_id
      }));
      
    }
    

    // Combine existing images with new ones
    const updatedImages = [...event.images, ...newImages];

    // Parse date and time inputs if they are provided
    let dateStart, dateEnd;
    if (req.body.dateStart && req.body.timeStart) {
      dateStart = parseDateTime(req.body.dateStart, req.body.timeStart);
    }
    if (req.body.dateEnd && req.body.timeEnd) {
      dateEnd = parseDateTime(req.body.dateEnd, req.body.timeEnd);
    }

    // Prepare the update object
    const updateObject = {
      name: req.body.name || event.name,
      location: req.body.location || event.location,
      description: req.body.description || event.description,
      images: updatedImages,
      organization: req.body.organization || event.organization,
      dateStart: dateStart || event.dateStart,
      dateEnd: dateEnd || event.dateEnd,
      userId: req.body.userId || event.userId,
      userName: req.body.userName || event.userName
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateObject,
      { new: true }
    );

    res.status(200).json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE route to remove an event
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Delete images from Cloudinary
    if (event.images && event.images.length > 0) {
      const deletePromises = event.images.map(image => 
        cloudinary.uploader.destroy(image.publicId)
      );
      await Promise.all(deletePromises);
    }

    // Delete the event from the database
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
