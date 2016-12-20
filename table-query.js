var co = require('co');
var Session = require('tryton-session');
var model = require('tryton-model');
var config = require('./config');
//
model.init(Session);
//
co(function* () {
    // Create a session
    var session = new Session(config.URL, config.DB);
    // Start a session - connect to server and load rights
    yield session.start(config.USERNAME, config.PASSWORD);
    // Search on 'table' model based on criteria: http://doc.tryton.org/4.0/trytond/doc/topics/domain.html
    var tables = yield model.Group.search(session, 'table', {
      domain: ['name', 'ilike', '%nucléaire%']
    });
    // read table
    var table = tables.head();
    yield table.read();
    // read cells
    var cells = yield table.get('cells');
    yield cells.read();
    // print table
    console.log(table.toJSON());
  })
  .then(null, console.error);
