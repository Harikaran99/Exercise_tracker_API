const express = require('express')
const app = express()
const mongoose = require('mongoose') 
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// mongoose settings

mongoose.connect(process.env.MONGO_URI).then(() => console.log("connected !")).catch((error) => console.log(error))

// user collection
const userSchema = new mongoose.Schema({
  username : String
})

const Users = mongoose.model("Users", userSchema)

// logs collection

const LogsShema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  logs: [{
  _id: false,
  description: String,
  duration: Number,
  date: String
  }]
})

const Logs = mongoose.model("Logs", LogsShema)


//express configuration

app.post("/api/users", (req, res,next) => {
  const userName =  req.body.username
  const userRecord = new Users({
    username: userName
  })
  userRecord.save()
  res.json(userRecord)
  next()
})

app.get("/api/users",(async (req, res, next) => {
  const allUsers = await Users.find()
  res.json(allUsers)
  next()
}))

app.post("/api/users/:_id/exercises",async (req, res, next) => {
  if(!mongoose.Types.ObjectId.isValid(req.params._id)) {
    res.status(400).send("Error: Your ID Invalid please enter right ID")
    next()
    return null
  }
  const id = new mongoose.Types.ObjectId(req.params._id)
  const userName = await Users.findById(id)
  const description = req.body.description 
  const duration = req.body.duration 
  const date = !!req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  const checkIdExitsInUser = await Users.findById(id).then(doc => !!doc).catch(() => false)
  const checkIdExitsInLogs = await Logs.findById(id).then(doc => !!doc).catch(() => false)
  const logs = {
    description: description,
    duration: duration,
    date: date}
  if(checkIdExitsInUser && checkIdExitsInLogs) {
    var LogsRecord = await Logs.findByIdAndUpdate(id ,{ $push: {logs: logs} }, {new: true, useFindAndModify: false}) 
  } else if(checkIdExitsInUser && !checkIdExitsInLogs) {
    var LogsRecord = new Logs({
      _id: id,
      logs: [logs]
    })
    LogsRecord.save()
  } else if(!checkIdExitsInUser && !checkIdExitsInLogs) {
    res.send(`error : please enter valid ID or your ID is not registered please register your name `)
  }

  res.json({
    _id: id,
    username: userName.username,
    ...logs
  })

  next()
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
