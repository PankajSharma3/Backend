import Request from '../model/requestModel.js';
import Items from '../model/itemModel.js';

export const getRequests = async (req, res) => {
    try {
        const data = await Request.find();
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        // If approving the request, update inventory
        if (status === 'approved' && request.requestStatus !== 'approved') {
            const itemName = request.name;
            const quantity = request.quantity;
            const blockRole = request.role; // e.g., block1, block2, etc.

            // 1. Deduct from store manager inventory
            const storeInventory = await Items.findOne({ role: 'storeManager' });
            if (!storeInventory) {
                return res.status(404).json({ error: "Store inventory not found" });
            }

            const storeItem = storeInventory.items.find(item => item.itemName === itemName);
            if (!storeItem) {
                return res.status(404).json({ error: "Item not found in store inventory" });
            }

            if (storeItem.itemCount < quantity) {
                return res.status(400).json({ error: "Insufficient stock in store" });
            }

            // Deduct from store
            const previousStoreCount = storeItem.itemCount;
            storeItem.itemCount -= quantity;

            // Add history entry for store (removal)
            storeInventory.itemHistory.push({
                itemName: itemName,
                action: 'sent',
                quantity: storeItem.itemCount,
                previousQuantity: previousStoreCount,
                date: new Date()
            });

            await storeInventory.save();

            // 2. Add to block manager inventory
            let blockInventory = await Items.findOne({ role: blockRole });

            if (!blockInventory) {
                // Create new inventory for this block if doesn't exist
                blockInventory = new Items({
                    role: blockRole,
                    items: [],
                    itemHistory: []
                });
            }

            const blockItem = blockInventory.items.find(item => item.itemName === itemName);

            if (blockItem) {
                // Item exists, update quantity
                const previousBlockCount = blockItem.itemCount;
                blockItem.itemCount += quantity;

                // Add history entry for block (update)
                blockInventory.itemHistory.push({
                    itemName: itemName,
                    action: 'updated',
                    quantity: blockItem.itemCount,
                    previousQuantity: previousBlockCount,
                    date: new Date()
                });
            } else {
                // Item doesn't exist, add new item
                blockInventory.items.push({
                    itemName: itemName,
                    itemCount: quantity
                });

                // Add history entry for block (addition)
                blockInventory.itemHistory.push({
                    itemName: itemName,
                    action: 'added',
                    quantity: quantity,
                    previousQuantity: 0,
                    date: new Date()
                });
            }

            await blockInventory.save();
        }

        request.requestStatus = status;
        if (status === 'approved') {
            request.approvedDate = new Date();
        } else {
            request.approvedDate = null;
        }
        await request.save();
        res.status(200).json({ message: "Request status updated successfully", data: request });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const createRequest = async (req, res) => {
    try {
        const { role, name, quantity, requestedDate, requestStatus } = req.body;
        const newRequest = new Request({ role, name, quantity, requestedDate, requestStatus });
        await newRequest.save();
        res.status(201).json({ message: "Request created successfully", requestId: newRequest._id });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await Request.find({ requestStatus: 'pending' });
        res.status(200).json({ data: pendingRequests });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getApprovedRequests = async (req, res) => {
    try {
        const approvedRequests = await Request.find({ requestStatus: 'approved' });
        res.status(200).json({ data: approvedRequests });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}