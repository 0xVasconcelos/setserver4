'use strict';
let net = require('net');
let SetDB = require('./db');
let db = new SetDB('mongodb://:@ds017231.mlab.com:17231/setserver');
let chalk = require('chalk');
let log = require('./lib/log.js');

let config = {};
config.port = 7000;

let fingerServer = net.createServer(setServer)
  .listen(config.port, () => log('server', "O servidor está sendo iniciado..."))
  .on('connection', (data) => log('TCP', 'Conexão estabelecida de ' + chalk.underline(data.remoteAddress + ':' + data.remotePort)))
  .on('listening', (data) => log('server', `O servidor foi iniciado em ${fingerServer.address().address}:${fingerServer.address().port}`))
  .on('error', (err) => errorHandler(err));

function setServer(sock) {
  let sessionId = null;
  let lastID;
  sock.setKeepAlive(true, 30000)
    .on('data', (data) => dataParser(data, sock, sessionId, (session) => sessionId = session))
    .on('close', (data) => errorHandler(data))
    .on('error', (err) => errorHandler(err));
}

function dataParser(data, sock, sessionId, fn) {
  try {
    data = JSON.parse(data);
  } catch (err) {
    errorHandler(err);
  }
  if (data.type === 'conn') {
    log('client', `O cliente ${data.hwid} está tentando se conectar...`);
    db.getEndpoints({
      hwid: data.hwid
    }, (query, err) => {
      query = query[0];
      if (err) {
        errorHandler(err);
        sendMessage(sock, 'authfail');
        log('server', `Ocorreu um erro e o cliente ${data.hwid} não pode ser autenticado!`);
      }
      if (query) {
        if (query.active === 1) {
          fn(data.hwid);
          sendMessage(sock, 'authok', query)
          log('server', `O cliente ${data.hwid} foi autenticado com sucesso!`);
        } else {
          sendMessage(sock, 'authfail');
          log('server', `O cliente ${data.hwid} está inativo!`);
        }
      } else {
        sendMessage(sock, 'authfail');
        log('server', `O cliente ${data.hwid} não está cadastrado!`);
      }
    })
  }
  if (sessionId) {
    switch (data.type) {
    case 'fingerid':
      sendMessage(sock, 'fingerid', data.id, sessionId)
      break;
    case 'addfinger':
      sendMessage(sock, 'addfinger')
      break;
    case 'registerok':
      saveUser(lastID);
      break;
    case 'registerfail':
      log('server', 'Falha na tentativa de registro do novo usuário! ID: ' + lastID);
      break;
    }
  }
}

function errorHandler(err) {
  switch (err.code) {
  case 'EADDRINUSE':
    log('tcperror', chalk.underline('A porta ' + err.port + ' está em uso.'));
    break;
  default:
    log('error', 'Erro desconhecido: ' + err.code);
    break;
  }
}

function sendMessage(sock, type, data, hwid) {
  switch (type) {
  case 'authok':
    sock.write(JSON.stringify({
      type: 'conn',
      'auth': 'ok',
      name: data.name
    }));
    break;
  case 'authfail':
    sock.write(JSON.stringify({
      type: 'conn',
      'auth': 'fail'
    }));
    break;
  case 'addfinger':
    getLastID(data, hwid, (data) => sock.write(data));
    break;
  case 'fingerid':
    checkFinger(data, hwid, (data) => sock.write(data));
    break;
  }
}

function checkFinger(id, hwid, fn) {
  /* Executa uma query no mongo por {fingerid: Number, hwid: String} */
  db.getUsers({
    roles: {
      $elemMatch: {
        fingerid: id,
        hwid: hwid
      }
    }
  }, (msg, err) => {
    /* Seleciona o primeiro item do query */
    let user = msg[0];
    /* Se houver algum erro no query, ele retorna mensagem de erro para o client e manda o erro para o errorHandler */
    if (err) {
      errorHandler(err, user)
      fn(JSON.stringify({
        type: "auth",
        auth: "fail"
      }))
    } else {
      if (user) {
        /* Se a query for válida, ele verifica se o usário está ativo no sistema */
        if (user.active) {
          /* Se estiver ativo, ele executa o callback com a string JSON, mostra no console e armazena no histórico */
          fn(JSON.stringify({
            type: "auth",
            auth: "ok",
            admin: user.admin,
            name: user.name
          }));
          log('client', `Nome: ${user.name} | ID do usuário: ${user.userid} | ID biométrico: ${id}`);
          db.includeHistory({
            date: new Date(),
            fingerid: id,
            userid: user.userid,
            hwid: hwid,
            msg: 'AUTH_OK'
          }, (msg) => {})
        } else {
          /* Se o usuário estiver inativo, ele executa o callback com a string JSON de erro, mostra no console e armazena no histórico como AUTH_FAIL_INACTIVE */
          fn(JSON.stringify({
            type: "auth",
            auth: "fail"
          }))
          db.includeHistory({
            date: new Date(),
            fingerid: -1,
            userid: -1,
            hwid: -1,
            msg: 'AUTH_FAIL_INACTIVE'
          }, (msg) => {})
          log('error', `Usuário inativo! ID: ${id}`);
        }
      } else {
         /* Se o usuário não existir, ele executa o callback com a string JSON de erro, mostra no console e armazena no histórico como AUTH_FAIL_NOTFOUND */
        fn(JSON.stringify({
          type: "auth",
          auth: "fail"
        }))
        db.includeHistory({
          date: new Date(),
          fingerid: -1,
          userid: -1,
          hwid: -1,
          msg: 'AUTH_FAIL_NOTFOUND'
        }, (msg) => {})
        log('error', `Usuário não cadastrado! ID: ${id}`);
      }
    }
  })
}


db.getEndpointLastID({hwid: 'GT-SET'}, (data, err) => console.log(data, err))

function getLastID(id, fn) {
  sequelize.query('SELECT * FROM `ids` WHERE available = 1 LIMIT 1').spread(function (results, metadata) {
    fn(JSON.stringify({
      type: "register",
      id: results[0].fingerid
    }));
    lastID = results[0].fingerid;
  })
  log('server', 'O ID: ' + id + ' foi enviado para cadastro de novo usuário!');
}

function saveUser(id) {
  sequelize.query('INSERT INTO users (userid, name, fingerid) VALUES (\'000000000000\', \'NOVO USUARIO\', \'' + id + '\')');
  sequelize.query('UPDATE `ids` SET available=0 WHERE fingerid=' + lastID);
  log('server', 'Novo usuário cadastrado com sucesso! ID: ' + lastID);
}
