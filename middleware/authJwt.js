// middleware/authJwt.js
const { expressjwt: jwt } = require('express-jwt');

function authJwt() {
    const secret = process.env.JWT_SECRET; // Ensure you have this set in your environment variables
    return jwt({
        secret,
        algorithms: ['HS256'],
    }).unless({
        path: [
            // Define the paths that do not require authentication
            '/api/v1/users/login',
            '/api/v1/users/register',
            '/api/v1/users/google_login',
        ],
    });
}

module.exports = authJwt;
