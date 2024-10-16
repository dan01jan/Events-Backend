function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        console.log('Unauthorized error:', err);
        return res.status(401).json({ message: "The user is not authorized" });
    }
    
    if (err.name === 'ValidationError') {
        console.log('Validation error:', err);
        return res.status(401).json({ message: err });
    }

    console.log('Unhandled error:', err);
    return res.status(500).json(err);
}

module.exports = errorHandler;
