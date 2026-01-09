import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    role: { type: String, required: true },
    displayName: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    requestedDate: { type: Date, default: Date.now },
    approvedDate: { type: Date },
    requestStatus: { type: String, default: 'pending' }
}, { timestamps: true });

const Request = mongoose.model('RequestModel', requestSchema);

export default Request;