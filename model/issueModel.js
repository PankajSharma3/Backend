import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true
    },
    issueTitle: {
        type: String,
        required: true,
        trim: true
    },
    issueType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;