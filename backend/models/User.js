import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  
  fullname: { 
    type: String, 
    required: true
  },
  
  passwordHash: { 
    type: String, 
    required: true,
    select: false  
  },
  
  role: { 
    type: String, 
    enum: ['admin', 'user'],
    default: 'user'
  },
  
  lastLogin: {
    type: Date,
    default: null
  }
  
}, { 
  timestamps: true  
});

userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// So sánh password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;