const express= require('express');
const mongoose= require('mongoose');

const router = express.Router()

router.get('/', (req,res,next)=>{
    const status = ['connected','connecting','disconnecting','disconnected']
    res.json({
        status:"ok",
        uptime:process.uptime(),
        db:status[mongoose.connection.readyState] || "unknown", // gives the status of the database connection
        timestamp: new Date().toISOString(),
        
    })
   
})

module.exports = router;