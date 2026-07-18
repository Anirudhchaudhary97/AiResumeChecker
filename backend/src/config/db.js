const mongoose = require('mongoose');
const env= require('./env');

mongoose.set('strictQuery', true);


const connectDB = async () => {
    try {
      const conn=  await mongoose.connect(env.mongoDbUri,{
        serverSelectionTimeoutMS: 10_000,
      });
      console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    });

};

module.exports = { connectDB };