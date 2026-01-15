import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    submittedBy: {
        type: String,  // username
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
    },
    resolvedDate: {
        type: Date
    },
    description: {
        type: String,
        required: true
    },
    notes: {
        type: String // for store manager to add notes
    }
}, { timestamps: true });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
