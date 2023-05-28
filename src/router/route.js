const http = require("http");
const parse = require("../utils/url-to-regex");
const queryParse = require("../utils/query-param");
const buffer = require('buffer')
const path = require('path')
const fs = require('fs')
const xlib = require('zlib')
const processMiddleware = require('../middleware/middleware')
let server;


function createResponse(res) {
    res.send = (message) => res.end(message);
    res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
        // res.end();
    };
    res.sendFile = (file, path) => {
        try {
            let file = fs.readFileSync(path) // sync is for readability
            let gzip = zlib.gzipSync(file) // is instance of Uint8Array
            headers['Content-Length'] = gzip.length // not the file's size!!!

            res.writeHead(200, headers)

            let chunkLimit = 16 * 1024 // some clients choke on huge responses
            let chunkCount = Math.ceil(gzip.length / chunkLimit)
            for (let i = 0; i < chunkCount; i++) {
                if (chunkCount > 1) {
                    let chunk = gzip.slice(i * chunkLimit, (i + 1) * chunkLimit)
                    res.write(chunk)
                } else {
                    res.write(gzip)
                }
            }
        } catch (error) {
            console.log(error)
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("ERROR File does not exist");
        }
    }
    return res;
}


function route() {
    let routeTable = {};
    let parseMethod = "json"; // json, plain text

    function readBody(req) {
        return new Promise((resolve, reject) => {
            let body;
            req.on("data", (chunk) => {
                body = chunk
            });
            req.on("end", () => {
                resolve(body);
            });
            req.on("error", (err) => {
                reject(err);
            });
        });
    }

    server = http.createServer(async (req, res) => {
        const routes = Object.keys(routeTable);
        let match = false;
        for (var i = 0; i < routes.length; i++) {
            const route = routes[i];
            const parsedRoute = parse(route);
            if (
                new RegExp(parsedRoute).test(req.url) &&
                routeTable[route][req.method.toLowerCase()]
            ) {
                let cb = routeTable[route][req.method.toLowerCase()];
                let middleware = routeTable[route][`${req.method.toLowerCase()}-middleware`];
                const m = req.url.match(new RegExp(parsedRoute));

                req.params = m.groups;
                req.query = queryParse(req.url);

                let body = await readBody(req);
                if (parseMethod === "json") {
                    body = body ? JSON.parse(body) : {};
                }
                req.body = body;

                const result = await processMiddleware(middleware, req, createResponse(res));
                console.log(result, 'res')
                if (result) {
                    cb(req, res)
                }

                match = true;
                break;
            }
        }
        if (!match) {
            res.statusCode = 404;
            res.end("Not found");
        }
    });

    function registerPath(path, cb, method, middleware) {
        if (!routeTable[path]) {
            routeTable[path] = {};
        }
        routeTable[path] = { ...routeTable[path], [method]: cb, [method + "-middleware"]: middleware };
    }

    return {
        get: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], "get");
            } else {
                registerPath(path, rest[1], "get", rest[0]);
            }
        },
        post: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], "post");
            } else {
                registerPath(path, rest[1], "post", rest[0]);
            }
        },
        put: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], "put");
            } else {
                registerPath(path, rest[1], "put", rest[0]);
            }
        },
        delete: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], "delete");
            } else {
                registerPath(path, rest[1], "delete", rest[0]);
            }
        },
        bodyParse: (method) => parseMethod = method,
        listen: (port, cb) => {
            server.listen(port, cb);
        },
        _server: server
    };
}

module.exports = route;