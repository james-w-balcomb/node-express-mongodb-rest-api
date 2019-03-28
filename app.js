const express = require('express')
const app = express()
const port = 3000
const MongoClient = require('mongodb').MongoClient

const mongoConnection = MongoClient.connect('mongodb://localhost:27017/') // returns a Promise

app.get('/', function(req, res) {
    mongoConnection.then(client => client.db('test').collection('test').find({}).toArray(function(err, docs) {
        if(err) { console.error(err) }
        res.send(JSON.stringify(docs))
    }))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
