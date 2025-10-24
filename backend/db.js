const mongoose = require('mongoose');

const uri = "mongodb+srv://ambikashelf:anuj#678@cluster0.pulil65.mongodb.net/ambikashelfDB?retryWrites=true&w=majority";

mongoose.connect(uri, {
    useNewUrlParser: true,
        useUnifiedTopology: true
        })
        .then(() => console.log('MongoDB Connected!'))
        .catch(err => console.log('MongoDB connection error:', err));

        module.exports = mongoose;