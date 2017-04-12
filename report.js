const _ = require('lodash');
const co = require('co');
const Session = require('tryton-session');
const model = require('tryton-model');
const config = require('./config');
//
model.init(Session);
//
const CHUNK_SIZE = 1024;
const WORKERS = 4;
const MODEL = 'contract';
const DOMAIN = ['status', '=', 'active'];
//
var chunks;
//
function* worker() {
  const session = new Session(config.URL, config.DB);
  yield session.start(config.USERNAME, {
    password: config.PASSWORD
  });
  while (true) {
    const chunk = chunks.pop();
    if (!chunk) {
      break;
    }
    const contracts = yield model.Group(session, MODEL);
    contracts.init(chunk);
    yield contracts.read('*');
    const subscribers = yield model.Group(session, 'party.party');
    const subscriberIds = _.uniq(contracts.get('subscriber'));
    subscribers.init(subscriberIds);
    yield subscribers.read();
    yield contracts.map(print);
  }
}

function* print(contract) {
  const subscriber = yield contract.get('subscriber', {
    inst: true
  });
  console.log([contract.get('contract_number'), subscriber.get('name')].join(
    ','));
}

function main() {
  co(function* () {
      const session = new Session(config.URL, config.DB);
      yield session.start(config.USERNAME, {
        password: config.PASSWORD
      });
      const contracts = yield model.Group.search(session, MODEL, {
        domain: DOMAIN
      });
      chunks = _.chunk(contracts.map((c) => c.id), CHUNK_SIZE);
      yield _.map(_.range(WORKERS), worker);
    })
    .then(null, console.error);
}
main();
