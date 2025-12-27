import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  
  // Telegram info
  accountID: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  
  phoneNumber: { 
    type: String, 
    required: true,
    unique: true 
  },
  
  firstName: { 
    type: String,
    default: null
  },
  
  // Session info
  sessionPath: { 
    type: String,
    required: true
  },
  
  isAuthenticated: { 
    type: Boolean, 
    default: false 
  },
  
  lastActive: { 
    type: Date, 
    default: Date.now,
    index: true
  }
  
}, { 
  timestamps: true
});

// Indexes
accountSchema.index({ owner: 1 });

const Account = mongoose.model("Account", accountSchema);

export default Account;