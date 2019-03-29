const express = require('express')
const app = express()
const port = 3000
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID

const mongoConnection = MongoClient.connect('mongodb://localhost:27017/') // returns a Promise

// https://nodejs.org/api/stream.html#stream_stream
function streamConsumer(req, res, next) {
  let body = '';
  // Get the data as utf8 strings.
  // If an encoding is not set, Buffer objects will be received.
  req.setEncoding('utf8');
  // Readable streams emit 'data' events once a listener is added
  req.on('data', (chunk) => {
    console.log(`Received ${chunk.length} bytes of data.`);
    body += chunk;
  });
  // The 'end' event indicates that the entire body has been received
  req.on('end', () => {
    console.log('There will be no more data.');
    try {
      // const data = JSON.parse(body);
      // // Write back something interesting to the user:
      // res.write(typeof data);
      // res.end();
      let data = ''
      if (req.headers['content-type'] === 'application/json') {
        data = JSON.parse(body)
      } else {
        data = body
      }
      req.body = data
      next()
    } catch (er) {
      // uh oh! bad json!
      res.statusCode = 400;
      return res.end(`error: ${er.message}`);
    }
  });
}

app.use(streamConsumer);

/*
  CRUD functions for MongoDB Documents (Database->Collection->Document)
*/
// (C)reate
async function createDocument(doc) {
  await mongoConnection.then(client => client.db('test').collection('test').insertOne(doc))
}
// (R)etrieve
async function retrieveDocument(documentId) {
  return mongoConnection.then(client => client.db('test').collection('test').findOne({"_id": new ObjectId(documentId)}))
}
// (U)pdate
async function updateDocument(documentId, doc) {
  delete doc._id
  await mongoConnection.then(client => client.db('test').collection('test').updateOne({ _id: new ObjectId(documentId), },{$set: {...doc,},},))
}
// (D)elete
async function deleteDocument(documentId) {
  await mongoConnection.then(client => client.db('test').collection('test').deleteOne({"_id": new ObjectId(documentId)}))
}
/*
  CRUD routes for API End-Points
*/
// (C)reate
app.post('/create', async (req, res) => {
  await createDocument(req.body)
  res.send({ message: 'Created Document' })
})
// (R)etrieve
app.get('/retrieve/:documentId', async (req, res) => {
  res.send(await retrieveDocument(req.params.documentId))
})
// (U)pdate
app.put('/update/:documentId', async (req, res) => {
  await updateDocument(req.params.documentId, req.body)
  res.send({ message: 'Updated Document' })
})
// (D)elete
app.delete('/delete/:documentId', async (req, res) => {
  await deleteDocument(req.params.documentId)
  res.send({ message: 'Deleted Document' })
})

// Get Array of Field from Documents
async function getFieldArray() {
    let fieldArrayObject = {}
    fieldArrayObject["fieldArray"] = []
    await mongoConnection.then(client => client.db('test').collection('test').find({}).forEach(function(doc) {
      let fieldValue = doc.KandR
      fieldArrayObject["fieldArray"].push(fieldValue)
      })
    )
    return fieldArrayObject
}
app.get('/field-array', async (req, res) => {
  console.log('get /field-array')
  res.json(await getFieldArray())
})

app.get('/', function(req, res) {
    mongoConnection.then(client => client.db('test').collection('test').find({}).toArray(function(err, docs) {
        if(err) { console.error(err) }
        res.send(JSON.stringify(docs))
    }))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
