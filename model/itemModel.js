import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    items: [{
        itemName: {
            type: String,
            required: true,
            trim: true
        },
        itemCount: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        _id: false
    }],
    itemHistory: [{
        itemName: {
            type: String,
            required: true
        },
        action: {
            type: String,
            enum: ['added', 'updated', 'sent', 'returned', 'consumed', 'damaged', 'expired', 'returned_not_received', 'removed_not_received'],
            required: true
        },
        fromRole: {
            type: String,
            default: null
        },
        toRole: {
            type: String,
            default: null
        },
        quantity: Number,
        previousQuantity: Number,
        description: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'resolved'],
            default: 'pending'
        },
        resolution: {
            type: String,
            default: ''
        },
        resolvedDate: {
            type: Date,
            default: null
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const ItemModel = mongoose.model('ItemModel', itemSchema);

export default ItemModel;