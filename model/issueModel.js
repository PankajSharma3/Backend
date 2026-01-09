import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
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
    reportedBy: {
        type: String,
        default: "Unknown"
    },
    status: {
        type: String,
        enum: ['open', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    resolution: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;