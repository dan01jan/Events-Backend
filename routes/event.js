const express = require('express');
const { Event } = require('../models/event');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage });


//Get All Events
router.get(`/`, async (req, res) => {
    try {
        const events = await Event.find(); // Fetch all events from the database
        if (!events) {
            return res.status(404).json({ success: false, message: 'No events found' });
        }
        res.status(200).json(events); // Return all events
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//Create Events
router.post(`/`, async (req, res) => {
    // const files = req.files;
    // if (!files || files.length === 0) return res.status(400).send('No images in the request');

    // let images = [];
    // const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    // files.forEach(file => {
    //     const fileName = file.filename;
    //     images.push(`${basePath}${fileName}`);
    // });

    const event = new Event({
        name: req.body.name,
        description: req.body.description,
        dateStart: req.body.dateStart,
        dateEnd: req.body.dateEnd,
        images: req.body.images,
    });
   
    const savedEvent = await event.save();

    if (!savedEvent) return res.status(500).send('The event cannot be created');

    res.send(savedEvent);
});

// router.put('/:id', uploadOptions.array('images', 10), async (req, res) => {
//     console.log(req.body);
//     if (!mongoose.isValidObjectId(req.params.id)) {
//         return res.status(400).send('Invalid Brand Id');
//     }

//     const brand = await Brand.findById(req.params.id);
//     if (!brand) return res.status(400).send('Invalid Product!');

//     let images = brand.images; // Existing images

//     const files = req.files;
//     if (files && files.length > 0) {
//         // If new images are uploaded, add them to the existing images array
//         const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
//         const newImages = files.map(file => `${basePath}${file.filename}`);
//         images = images.concat(newImages);
//     }

//     const updatedBrand = await Brand.findByIdAndUpdate(
//         req.params.id,
//         {
//             name: req.body.name,
//             description: req.body.description,
//             images: images // Update images with the combined array of existing and new images
//         },
//         { new: true }
//     );

//     if (!updatedBrand) return res.status(500).send('the brand cannot be updated!');

//     res.send(updatedBrand);
// });

//Event Update
router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Event ID');
    }

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                dateStart: req.body.dateStart,
                dateEnd: req.body.dateEnd,
                images: req.body.images
            },
            { new: true } // This option returns the updated document
        );

        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Event Delete
router.delete('/:id', (req, res)=>{
    Event.findByIdAndRemove(req.params.id).then(event =>{
        if(event) {
            return res.status(200).json({success: true, message: 'the event is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "event not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})


//Event create feedback
router.post('/:id/feedback', async (req, res) => {
    const eventId = req.params.id;

    if (!mongoose.isValidObjectId(eventId)) {
        return res.status(400).send('Invalid Event ID');
    }

    // Find the event by its ID
    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).send('Event not found');
    }

    // Append new feedback to the feedback array
    const feedback = {
        user: req.body.user,
        comment: req.body.comment
    };

    event.feedback.push(feedback);

    try {
        const updatedEvent = await event.save(); // Save the updated event with new feedback
        res.status(200).json(updatedEvent); // Return the updated event data
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//         return res.status(400).send('Invalid Product Id');
//     }
//     const files = req.files;
//     let imagesPaths = [];
//     const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

//     if (files) {
//         files.map((file) => {
//             imagesPaths.push(`${basePath}${file.filename}`);
//         });
//     }

//     const brand = await Brand.findByIdAndUpdate(
//         req.params.id,
//         {
//             images: imagesPaths
//         },
//         { new: true }
//     );
        
//     if (!brand) return res.status(500).send('the gallery cannot be updated!');

//     res.send(brand);
// });

module.exports=router;