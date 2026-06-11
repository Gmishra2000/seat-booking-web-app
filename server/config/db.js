import mongoose from "mongoose";


const connectDB = async () =>{
    try{
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✅ MongoDB connected successfully');
        return true;
    }catch(err){
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
}
export default connectDB;