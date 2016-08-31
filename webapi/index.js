'use strict';
let log = require('../lib/log')
let app = require('./routes')


let server = app.listen(2666, function () {
    let host = server.address().address;
    let port = server.address().port;
    log('server',`WebAPI iniciado em http://${host}:${port}`);
});