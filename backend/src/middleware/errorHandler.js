const env = require('../config/env')
const ApiError = require('../utils/ApiError')

const notFound= (req, res, next)=>{
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
    
}


const errorHandler= (err, req, res, next)=>{
    let status= err.statusCode || 500;
    let message= err.message || 'Internal Server Error';
    let details= err.details
    
    
    if(err.name=== "ValidationError" && err.errors){
        status=400
        details= Object.fromEntries(
            Object.entries(err.errors).map(([k, v])=>[k, v.message])
        )
        message="Validation Failed"
    }else if (err.name === 'CastError'){
        status=400
        message=`Invalid ${err.path} : ${err.value}`
    }else if (err.code === 11000){
        status=400
        message=`Duplicate key error`
        details=err.keyValue
    }else if (err.name ==="ZodError"){
        status=400
        details=err.issues
        message="Validation Failed"
    }

    if(status>=500){
       console.error(`${req.method}${req.originalUrl}:`, err)
    }
        

    res.status(status).json({
      error:{
        message,
        ...(details ? {details}: {}),
        ...(env.isProduction ? {}: {stack: err.stack})
      }
    })
    
}
module.exports={
    notFound,
    errorHandler
}


