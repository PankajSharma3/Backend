import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    role: { type: String, required: true },
    displayName: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    requestedDate: { type: Date, default: Date.now },
    approvedDate: { type: Date },
    requestStatus: { type: String, default: 'pending' },
    confirmationStatus: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'not_received'] }
}, { timestamps: true });

const Request = mongoose.model('RequestModel', requestSchema);

export default Request;