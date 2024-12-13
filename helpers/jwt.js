// const expressjwt = require('express-jwt');
const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
    const secret = process.env.JWT_SECRET;
    const api = process.env.API_URL;
    return jwt({
        secret,
        algorithms: ['HS256'],
        // isRevoked: isRevoked
    })
        .unless({
            path: [
                { url: "/", methods: ['GET','POST', 'PUT', 'OPTIONS', 'DELETE'] }, 
                {
                    url: /\/api\/v1\/events(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS']
                },
                {
                    url: /\/api\/v1\/questionnaires(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS']
                },
                {
                    url: /\/api\/v1\/sentiments(.*)/,
                    methods: ['GET', 'POST', 'OPTIONS']
                },
                {
                    url: /\/api\/v1\/course(.*)/,
                    methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS']
                },
                `${api}/users`,
                `${api}/users/login`,
                `${api}/users/register`,
                `${api}/users/logout`,
                `${api}/users/google_login`,
                `${api}/users/me`,
            ]
        });
}

async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true);
    }
    done();
}

module.exports = authJwt;
