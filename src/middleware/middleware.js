
function processMiddleware(middleware, req, res) {
    if (!middleware) {
        // resolve false
        return new Promise((resolve) => resolve(true));
    }

    return new Promise((resolve) => {
        middleware(req, res, function () {
            resolve(true);
        });
    });
}

module.exports = processMiddleware