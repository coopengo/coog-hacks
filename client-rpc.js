var co = require('co');
var Session = require('tryton-session');
var model = require('tryton-model');
var config = require('./config');
//
model.init(Session);
//
co(function* () {
    var session = new Session(config.URL, config.DB);
    yield session.start(config.username, config.password);
    var tables = yield model.Group.search(session, 'table', {
      domain: ['name', 'ilike', '%nucléaire%']
    });
    yield tables.read();
    tables.each((t) => console.log(t.get('name', {
      inst: false
    })));
    return 'ok';
  })
  .then(console.log, console.error);
