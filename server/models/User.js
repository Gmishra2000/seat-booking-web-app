import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        minlength:3,
        maxlength:50,
        lowercase:true
    },
    email: {
        type: String,
        required:[true, 'Please provide an email'],
        unique: true,
        match:[
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email"
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength:8,
        select:false // Don't return password by default
    },
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default:''
    },
    phone:{
        type: String,
        default:''
    },
    role:{
        type:String,
        enum:['admin','user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

// Hash password before saving to middleware
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified or is completely new
  if (!this.isModified('password')) return;

  try {
    // Generate a secure salt with a cost factor of 12
    const salt = await bcrypt.genSalt(12);

    // Hash the password along with the salt and replace the plain text string
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Add a custom method to the userSchema object
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Use bcrypt to securely compare the incoming text with the stored hash
    // "this.password" refers to the password hash of the specific user document
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

const User = mongoose.model('User', userSchema);
export default User;