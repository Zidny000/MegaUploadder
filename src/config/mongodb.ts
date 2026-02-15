import mongoose from 'mongoose'

export const initializeDatabase = async (): Promise<void>  => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "")
    console.log("Connected to Database")
  }catch(e) {
    console.log('Error Connecting Database', e)
  }
} 

