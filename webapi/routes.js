'use strict';
let express = require('express');
let app = express();
let _SETSERVER = require('../package.json');

/* 
Rota para /
Exibe uma mensagem do servidor e sua versão.
*/

app.get('/', (req, res) =>  res.json({msg: "SETSERVER", version: _SETSERVER.version}));

/*
Rota para /getEndpoints
Retorna todos terminais SETFINGER ativados no servidor 
*/

app.get('/getEndpoints', (req, res) => res.json({msg: "SETSERVER", version: _SETSERVER.version}));



module.exports = app;