var _ = require('lodash');
var co = require('co');
var vsprintf = require('sprintf-js')
  .vsprintf;
var Session = require('tryton-session');
var model = require('tryton-model');
var config = require('./config');
//
model.init(Session);
//
var session;
/*
 * This is a script to extract loans report from Coog based on Backend
 * RPC calls (via tryton-model library)
 * The report generated prints one line per loan insured
 */
var BATCH_SIZE = 64; // makes stuff run in concurrencial without explosing limits
var LOAN_LINE_LABELS = ['amount', 'rate', 'payment_frequency']; // data to retrieve
var LOAN_LINE = '%12d%8d%s'; // how to print data
var INSURED_LINE_LABELS = ['id', 'name', 'first_name']; // data to retrieve
var INSURED_LINE = '%10d%25s%25s'; // how to print data
function* query() { // customize this function to limit report scope (domain)
  var loans = yield model.Group.search(session, 'loan', {
    domain: []
  });
  return loans.records;
}

function* printInsured(loanLine, insured) { // Insured data transformation
  insured = yield insured.get();
  console.log(loanLine + vsprintf(INSURED_LINE, _.map(INSURED_LINE_LABELS, (k) =>
    insured[k])));
}

function* printLoan(loan) { // Loan data transformation
  yield loan.read();
  loan = yield loan.get();
  loan.amount = loan.amount * 100;
  loan.rate = loan.rate * 100000;
  if (loan.payment_frequency === 'month') {
    loan.payment_frequency = 'M';
  }
  else
  if (loan.payment_frequency === 'trimester') {
    loan.payment_frequency = 'T';
  }
  else
  if (loan.payment_frequency === 'semester') {
    loan.payment_frequency = 'S';
  }
  else
  if (loan.payment_frequency === 'year') {
    loan.payment_frequency = 'Y';
  }
  else {
    loan.payment_frequency = 'X';
  }
  var loanLine = vsprintf(LOAN_LINE, _.map(LOAN_LINE_LABELS, (k) => loan[k]));
  yield loan.insured_persons.read();
  for (var insured of loan.insured_persons.records) {
    yield printInsured(loanLine, insured);
  }
}

function main() {
  co(function* () {
      session = new Session(config.URL, config.DB);
      yield session.start(config.USERNAME, config.PASSWORD);
      var loans = yield query();
      while (!_.isEmpty(loans)) {
        yield _.map(_.take(loans, BATCH_SIZE), printLoan);
        loans = _.tail(loans, BATCH_SIZE);
      }
    })
    .then(null, console.error);
}
main();
