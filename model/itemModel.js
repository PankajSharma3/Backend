import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
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
            enum: ['added', 'updated', 'sent', 'returned', 'consumed'],
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
        date: {
            type: Date,
            default: Date.now
        },
        _id: false
    }]
}, { timestamps: true });

const ItemModel = mongoose.model('ItemModel', itemSchema);

export default ItemModel;