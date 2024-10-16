const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const  {google} = require('googleapis')
const {OAuth2} = google.auth;

const client = new OAuth2('920213136950-8j3ng8qursis2pib3qhav9q2larqfu89.apps.googleusercontent.com')

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

const tokenBlacklist = []; 

const uploadOptions = multer({ storage: storage });
router.get(`/`, async (req, res) => {
    // const userList = await User.find();
    const userList = await User.find().select('-passwordHash');
    console.log(userList)

    if (!userList) {
        res.status(500).json({ success: false })
    }
    res.send(userList);
})


router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
        res.status(500).json({ message: 'The user with the given ID was not found.' })
    }
    res.status(200).send(user);
})


//User Register
router.post('/', async (req, res) => {
    const { password, name, email, phone, isAdmin } = req.body;

    // Validate that a password is provided
    if (!password) {
        return res.status(400).send('Password is required');
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);

    let user = new User({
        name,
        email,
        passwordHash,
        phone,
        isAdmin,
    });

    try {
        user = await user.save();
        res.send(user);
    } catch (error) {
        res.status(400).send('The user cannot be created!');
    }
});


router.put('/:id', async (req, res) => {

    const userExist = await User.findById(req.params.id);
    let newPassword
    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        },
        { new: true }
    )

    if (!user)
        return res.status(400).send('the user cannot be created!')

    res.send(user);
})


//users login
router.post('/login', async (req, res) => {
    console.log(req.body.email)
    const user = await User.findOne({ email: req.body.email })

    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send('The user not found');
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            { expiresIn: '1d' }
        )

        res.status(200).send({ user: user.email, token: token })
    } else {
        res.status(400).send('password is wrong!');
    }


})

router.post('/google_login', async (req, res) => {
    try {
        const { tokenId } = req.body;
        const verify = await client.verifyIdToken({
            idToken: tokenId,
            audience: "405532974722-t5a0lvua754v8jkc1lc4uvtkv305ghtm.apps.googleusercontent.com"
        });

        const { email_verified, email, name } = verify.payload;

        if (!email_verified) {
            return res.status(400).json({ msg: "Email verification failed." });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({ name, email });
            await user.save();
        }

        const token = jwt.sign(
            {
                userId: user._id, // use _id from MongoDB
                isAdmin: user.isAdmin
            },
            process.env.JWT_SECRET, // Using environment variable for JWT secret
            { expiresIn: process.env.JWT_EXPIRES_TIME } // Using environment variable for token expiration
        );

        // Return the JWT token along with user information
        res.status(200).json({ msg: "Login successful", user, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: err.message });
    }
});

// router.post('/register', async (req, res) => {
//     let user = new User({
//         name: req.body.name,
//         email: req.body.email,
//         passwordHash: bcrypt.hashSync(req.body.password, 10),
//         phone: req.body.phone,
//         isAdmin: req.body.isAdmin
//     })
//     user = await user.save();

//     if (!user)
//         return res.status(400).send('the user cannot be created!')

//     res.send(user);
// })


router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({ success: true, message: 'the user is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "user not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments((count) => count)

    if (!userCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        userCount: userCount
    });
})

router.post('/logout', (req, res) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(400).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Add the token to a blacklist (for demonstration purposes, this is an array)
    // tokenBlacklist.push(token);

    res.status(200).json({ message: 'User logged out successfully' });
});

module.exports = router;