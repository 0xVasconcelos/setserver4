'use strict';

let log = require('../lib/log');

class SetDB {
  constructor(connObj) {
    let mongoose = require('mongoose');
    let mongoConnecting = 1;
    mongoose.connect(connObj);
    log('DB', `Conectando ao servidor MongoDB`);
    mongoose.connection.on('connected', () => {
      mongoConnecting = 0
      log('DB', `Conectado com sucesso `);
    });
    let deasync = require('deasync');;
    while (mongoConnecting) {
      deasync.sleep(100);
    }
    this.mongoose = mongoose;
  }

  newEndpoint(endpointObj, fn) {
    let endpoints = require('./models/endpoints');
    let newEndpoint = new endpoints;
    newEndpoint.name = endpointObj.name;
    newEndpoint.hwid = endpointObj.name;
    newEndpoint.location = endpointObj.location;
    newEndpoint.capacity = endpointObj.capacity;
    newEndpoint.activeUsers = 0;
    newEndpoint.save(function (err) {
      if (err)
        fn(null, {
          err: true,
          data: err
        });
      else
        fn(newEndpoint, null);
    });
  }

  getEndpoints(endpointObj, fn) {
    let endpoints = require('./models/endpoints');
    endpoints.find(endpointObj, function (err, data) {
      if (err)
        fn(null, {
          err: true,
          data: err
        });
      else
        fn(data, null);
    });
  }

  getEndpointLastID(endpointObj, fn) {
    let endpoints = require('./models/endpoints');
    let self = this;
    self.getEndpoints({
      hwid: endpointObj.hwid
    }, (data, err) => {
      if (err) fn(null, err)
      else {
        if (data[0]) {
          data = data[0];
          if (data.activeUsers >= data.capacity) {
            fn(null, {
              err: true,
              data: 'ENDPOINT_ATCAPACITY'
            });
          } else {
            fn({
              hwid: endpointObj.hwid,
              capacity: data.capacity,
              lastID: data.activeUsers
            }, null);
          }
        } else {
          fn(null, {
            err: true,
            data: 'ENDPOINT_NOTFOUND'
          });
        }
      }
    });
  }

  updateEndpointCapacity(endpointObj, fn) {
    let endpoints = require('./models/endpoints');
    endpoints.findOne({
      hwid: endpointObj.hwid
    }, (err, data) => {
      if (!data) {
        fn(null, {
          err: true,
          data: 'ENDPOINT_NOTFOUND'
        });
      } else {
        endpoints.update({
          hwid: data.hwid
        }, {
          $set: {
            activeUsers: data.activeUsers + 1
          }
        }, (err) => {
          if (err) fn(null, {
            err: true,
            data: 'ENDPOINT_FAILED_UPDATE'
          })
        });
      }
    })
  }


  newUser(userObj, fn) {
    let users = require('./models/users');
    let newUser = new users;
    newUser.name = userObj.name;
    newUser.roles = userObj.roles;
    newUser.userid = userObj.userid;
    newUser.email = userObj.email;
    newUser.username = userObj.username;
    newUser.password = userObj.password;
    newUser.save(function (err) {
      if (err)
        fn(null, {
          err: true,
          data: err
        });
      else
        fn(newUser, null);
    });
  }

  getUsers(userObj, fn) {
    let users = require('./models/users');
    users.find(userObj, function (err, data) {
      if (err)
        fn(null, {
          err: true,
          data: err
        });
      else
        fn(data, null);
    });
  }

  includeHistory(userObj, fn) {
    let history = require('./models/history');
    let newHistory = new history;
    newHistory.date = new Date();
    newHistory.userid = userObj.userid;
    newHistory.fingerid = userObj.fingerid;
    newHistory.hwid = userObj.hwid;
    newHistory.save(function (err) {
      if (err)
        fn(null, {
          err: true,
          data: err
        });
      else
        fn(newHistory, null);
    });
  }
}

module.exports = SetDB;