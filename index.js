const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const knex = require('knex')
const cors = require('cors')

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
app.use(cors());

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

app.post('/newTask', (req, res) => {
  var jsonResp = {}
  const { Task, DueDate, Category, Status, UserId } = req.body;
  db.insert({
    task: Task,
    category: Category,
    status: Status,
    dueDate: DueDate,
    userId: UserId
  })
  .into("task")
  .returning('*')
  .then(task => {
    jsonResp.status = "success"
    jsonResp.info = "task created"
    jsonResp.data = task[0]
    res.status(200).send(jsonResp);
  })
  .catch(err => {
    console.log(err);
    jsonResp.status = "failed"
    jsonResp.info = "task not created"
    res.status(400).send(jsonResp);
  })
});

app.get('/allTask/:userId', (req, res) => {
  var jsonResp = {}
  db.select('task')
  .from('task')
  .where('userId', '=', req.params.userId)
  .then(data => {
    if(data.length == 0) {
      jsonResp.status = "success"
      jsonResp.info = "no task found"
      res.status(200).send(jsonResp);  
    } else {
      jsonResp.status = "success"
      jsonResp.info = "task found"
      jsonResp.data = data
      res.status(200).send(jsonResp);  
    }
  })
  .catch(err => {
    console.log(err);
    jsonResp.status = "failed"
    jsonResp.info = "no task found"
    res.status(400).send(jsonResp);
  })  
});

app.get('/taskBasedOnStatus/:userId/:status', (req, res) => {
  var jsonResp = {}
  db.select('task')
  .from('task')
  .where('status', '=', req.params.status)
  .where('userId', '=', req.params.userId)
  .then(data => {
    if(data.length == 0) {
      jsonResp.status = "success"
      jsonResp.info = "no task found"
      res.status(200).send(jsonResp);  
    } else {
      jsonResp.status = "success"
      jsonResp.info = "task found"
      jsonResp.data = data
      res.status(200).send(jsonResp);  
    }
  })
  .catch(err => {
    console.log(err);
    jsonResp.status = "failed"
    jsonResp.info = "no task found"
    res.status(400).send(jsonResp);
  })  
});

app.put('/updateTaskStatus', (req, res) => {
  var jsonResp = {}
  const { userId, status, taskId } = req.body
  db.update({
    status: status
  })
  .where('userId', '=', userId)
  .where('taskId', '=', taskId)
  .into('task')
  .returning('*')
  .then(data => {
    jsonResp.status = "success"
    jsonResp.info = "task updated"
    jsonResp.data = data
    res.status(200).send(jsonResp);  
  })
  .catch(err => {
    console.log(err);
    jsonResp.status = "failed"
    jsonResp.info = "task not updated"
    res.status(400).send(jsonResp);
  })
});

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
});