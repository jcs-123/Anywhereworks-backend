const mongoose = require('mongoose')

connectionString = process.env.DATABASE

mongoose.connect(connectionString).then(()=>{
    console.log(`MongoDB connected successfully`);
    
}).catch((err)=>{
    console.log(`MongoDB connected failed due to ${err}`);
    
})