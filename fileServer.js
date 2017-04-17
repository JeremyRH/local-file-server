/* eslint-env node */
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const serverConfigs = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key'), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'), 'utf8')
};

function getRequestHandler(fullPath) {
    return function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        const requestPath = path.join(fullPath, url.parse(req.url).pathname);
        const readStream = fs.createReadStream(requestPath);
        readStream.on('open', () => {
            readStream.pipe(res);
        });
        readStream.on('error', (err) => {
            res.statusCode = 404;
            res.end(err.message);
        });
    };
}

function createFileServer(fullPath, port) {
    const getHandler = getRequestHandler(fullPath);
    https.createServer(sslOptions, (req, res) => {
        if(req.method === 'GET') {
            getHandler(req, res);
        } else {
            res.writeHead(501, { 'Content-Length': 0 });
            res.end(501);
        }
    }).listen(port);
}

serverConfigs.forEach(({ path: fullPath, port }) => {
    createFileServer(fullPath, port);
});
