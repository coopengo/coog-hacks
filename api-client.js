const request = require('superagent')
const config = require('./config')
const parties = require('./parties')

const parseCookie = (header) => {
  return header.map((v) => v.slice(0, v.indexOf(' '))).join(' ').slice(0, -1)
}

const results = new Array(parties.length)

let cookie

const createParty = (party) => {
  return new Promise((resolve, reject) => {
    request
      .post(config.API + '/party/company')
      .set('Cookie', cookie)
      .send(party)
      .end((err, res) => {
        if (err) {
          resolve(res.body)
        } else {
          resolve(res.body)
        }
      })
  })
}

const main = async () => {
  let res
  res = await request
    .post(config.API + '/auth/login')
    .send({username: config.USERNAME, password: config.PASSWORD})
  cookie = parseCookie(res.headers['set-cookie'])
  for (let i = 0; i < parties.length; i++) {
    results[i] = await createParty(parties[i])
  }
}

main().then(() => {
  console.log(JSON.stringify(results))
}, (err) => {
  console.error(err)
})
