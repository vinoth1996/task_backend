const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'vinoth',
    database: 'Task'
  }
});

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/register', (req, res) => {
  var jsonResp = {};
  const { UserName, EmailId, Password } = req.body;
  const hash = bcrypt.hashSync(Password, 10);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      EmailId: EmailId
    })
    .into('login')
    .returning('EmailId')
    .then(loginEmail => {
      return trx('user')
      .returning('*')
      .insert({
        UserName: UserName,
        EmailId: loginEmail[0]
      })
      .then(user => {
        jsonResp.status = "success"
        jsonResp.info = "registered successfully"
        jsonResp.data = user[0]
        res.status(200).send(jsonResp);
      })
      .then(trx.commit)
      .catch(trx.rollback)    
    })
  })
  .catch(err => {
    console.log(err);
    jsonResp.status = "failed"
    jsonResp.info = "unable to register try with new credentials"
    res.status(400).send(jsonResp);
  })
});

app.post('/login', (req, res) => {
  var jsonResp = {}
  db.select('EmailId', 'hash').from('login')
  .where('EmailId', '=', req.body.EmailId)
  .then(data => {
    const isValid = bcrypt.compareSync(req.body.Password, data[0].hash)
    if(isValid) {
      return db.select('EmailId', 'UserName')
      .from('user')
      .where('EmailId', '=', req.body.EmailId)
      .then(user => {
        jsonResp.status = "success"
        jsonResp.info = "login successful"
        jsonResp.data = user[0]
        res.status(200).send(jsonResp)  
      })
      .catch(err => {
        console.log(err)
        jsonResp.status = "failed"
        jsonResp.info = "login invalid"
        res.status(401).send(jsonResp)  
      })
    } else {
      jsonResp.status = "failed"
      jsonResp.info = "login invalid"
      res.status(401).send(jsonResp)  
    }
  })
  .catch(err => {
    console.log(err)
    jsonResp.status = "failed"
    jsonResp.info = "login invalid"
    res.status(401).send(jsonResp)  
  })
});

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
});