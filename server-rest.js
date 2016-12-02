var koa = require('koa');
var bodyParser = require('koa-bodyparser');
var Session = require('tryton-session');
var model = require('tryton-model');
var config = require('./config');
//
model.init(Session);
//
var session = new Session(config.URL, config.DB);
//
var app = koa();
app.on('error', (err) => console.error(err));
app.use(bodyParser());
app.use(function* () {
  var data = this.request.body;
  var rules = yield model.Group.search(session, 'rule_engine', {
    domain: ['name', '=', 'Règle de tarification Incendie Centrale']
  });
  var rule = rules.head();
  var results = yield session.rpc('model.rule_engine.ws_execute', [rule.id, [{
    args: {},
    params: {
      compl_nombre_de_tranches: data.tranches,
      compl_reacteurs_par_tranche: data.reacteurs,
      compl_superficie_km2: data.superficie
    },
    tech: {}
  }]]);
  this.body = {
    res: results[0]
  };
});
//
session.start(config.username, config.password)
  .then(app.listen(3000), console.error);
