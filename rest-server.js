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
// middleware to parse request body
app.use(bodyParser());
// unique middleware (no urls management - service will respond on all POST queries)
app.use(function* () {
  var data = this.request.body;
  // search for the rule
  var rules = yield model.Group.search(session, 'rule_engine', {
    domain: ['name', '=', 'Règle de tarification Incendie Centrale']
  });
  var rule = rules.head();
  // executes rule
  var results = yield session.rpc('model.rule_engine.ws_execute', [rule.id, [{
    args: {},
    params: {
      compl_nombre_de_tranches: data.tranches,
      compl_reacteurs_par_tranche: data.reacteurs,
      compl_superficie_km2: data.superficie
    },
    tech: {}
  }]]);
  // send result
  this.body = {
    res: results[0]
  };
});
//
// start server after session starts
session.start(config.USERNAME, {
    password: config.PASSWORD
  })
  .then(app.listen(3000), console.error);
