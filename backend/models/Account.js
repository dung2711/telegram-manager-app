import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
    accountID: { type: String, required: true, unique: true },
    phoneNumber: String,
    sessionPath: String,
    isAuthenticated: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const Account = mongoose.model("Account", accountSchema);

export default Account;