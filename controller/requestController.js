import Request from '../model/requestModel.js';
import Items from '../model/itemModel.js';

export const getRequests = async (req, res) => {
    try {
        const data = await Request.find();
        res.status(200).json({ data });
    } catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;

        console.log('Updating request status:', { requestId, status });

        const request = await Request.findById(requestId);
        if (!request) {
            console.log('Request not found:', requestId);
            return res.status(404).json({ error: "Request not found" });
        }

        console.log('Request found:', {
            requestId: request._id,
            name: request.name,
            quantity: request.quantity,
            role: request.role,
            displayName: request.displayName
        });

        // If approving the request, update inventory
        if (status === 'approved' && request.requestStatus !== 'approved') {
            const itemName = request.name;
            const quantity = request.quantity;
            const blockRole = request.role; // username/identifier (e.g., block1)
            const blockDisplayName = request.displayName; // friendly name

            console.log('Approving request:', { itemName, quantity, blockRole, blockDisplayName });

            // 1. Deduct from store manager inventory
            const storeInventory = await Items.findOne({ role: 'storeManager' });
            if (!storeInventory) {
                console.log('Store inventory not found');
                return res.status(404).json({ error: "Store inventory not found" });
            }

            console.log('Store inventory items:', storeInventory.items.map(i => ({ name: i.itemName, count: i.itemCount })));

            const storeItem = storeInventory.items.find(item => item.itemName === itemName);
            if (!storeItem) {
                console.log('Item not found in store inventory:', itemName);
                console.log('Available items:', storeInventory.items.map(i => i.itemName));
                return res.status(404).json({ error: `Item "${itemName}" not found in store inventory` });
            }

            console.log('Store item found:', { itemName: storeItem.itemName, itemCount: storeItem.itemCount });

            if (storeItem.itemCount < quantity) {
                console.log('Insufficient stock:', { available: storeItem.itemCount, requested: quantity });
                return res.status(400).json({ error: "Insufficient stock in store" });
            }

            // Deduct from store
            const previousStoreCount = storeItem.itemCount;
            storeItem.itemCount -= quantity;

            console.log('Deducting from store:', { previousCount: previousStoreCount, newCount: storeItem.itemCount });

            // Add history entry for store (sent to block)
            storeInventory.itemHistory.push({
                itemName: itemName,
                action: 'sent',
                quantity: storeItem.itemCount,
                previousQuantity: previousStoreCount,
                fromRole: 'storeManager',
                toRole: blockRole,
                date: new Date()
            });

            await storeInventory.save();
            console.log('Store inventory saved successfully');

            // 2. Add to block manager inventory
            let blockInventory = await Items.findOne({ role: blockRole });

            console.log('Block inventory:', blockInventory ? 'found' : 'not found');

            if (!blockInventory) {
                // Create new inventory for this block if it doesn't exist
                console.log('Creating new inventory for block:', blockRole);
                blockInventory = new Items({
                    role: blockRole,
                    displayName: blockDisplayName || blockRole,
                    items: [],
                    itemHistory: []
                });
            } else if (!blockInventory.displayName && blockDisplayName) {
                // Backfill displayName for legacy inventories
                console.log('Backfilling displayName for block:', blockRole);
                blockInventory.displayName = blockDisplayName;
            }

            const blockItem = blockInventory.items.find(item => item.itemName === itemName);
            console.log('Block item:', blockItem ? 'exists' : 'new item');

            if (blockItem) {
                // Item exists, update quantity
                const previousBlockCount = blockItem.itemCount;
                blockItem.itemCount += quantity;

                console.log('Updating block item:', { previousCount: previousBlockCount, newCount: blockItem.itemCount });

                // Add history entry for block (received update)
                blockInventory.itemHistory.push({
                    itemName: itemName,
                    action: 'updated',
                    quantity: blockItem.itemCount,
                    previousQuantity: previousBlockCount,
                    fromRole: 'storeManager',
                    toRole: blockRole,
                    date: new Date()
                });
            } else {
                // Item doesn't exist, add new item
                console.log('Adding new item to block:', { itemName, quantity });
                blockInventory.items.push({
                    itemName: itemName,
                    itemCount: quantity
                });

                // Add history entry for block (received addition)
                blockInventory.itemHistory.push({
                    itemName: itemName,
                    action: 'added',
                    quantity: quantity,
                    previousQuantity: 0,
                    fromRole: 'storeManager',
                    toRole: blockRole,
                    date: new Date()
                });
            }

            await blockInventory.save();
            console.log('Block inventory saved successfully');
        }

        request.requestStatus = status;
        if (status === 'approved') {
            request.approvedDate = new Date();
        } else {
            request.approvedDate = null;
        }
        await request.save();
        console.log('Request status updated:', { status, requestId: request._id });
        res.status(200).json({ message: "Request status updated successfully", data: request });
    } catch (error) {
        console.error('Error updating request status:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const createRequest = async (req, res) => {
    try {
        const { role, displayName, name, quantity, requestedDate, requestStatus } = req.body;

        console.log('Creating request:', { role, displayName, name, quantity });

        // Allow deriving from authenticated user when not provided
        const derivedRole = role || req.user?.username;
        const derivedDisplay = displayName || req.user?.displayName;

        if (!derivedRole || !derivedDisplay || !name || quantity === undefined) {
            console.log('Missing required fields:', { derivedRole, derivedDisplay, name, quantity });
            return res.status(400).json({ error: "role, displayName, name and quantity are required" });
        }

        const newRequest = new Request({
            role: derivedRole,
            displayName: derivedDisplay,
            name,
            quantity,
            requestedDate,
            requestStatus
        });
        await newRequest.save();
        console.log('Request created successfully:', newRequest._id);
        res.status(201).json({ message: "Request created successfully", requestId: newRequest._id });
    } catch (error) {
        console.error('Error creating request:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await Request.find({ requestStatus: 'pending' });
        res.status(200).json({ data: pendingRequests });
    } catch (error) {
        console.error('Error getting pending requests:', error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const getApprovedRequests = async (req, res) => {
    try {
        const approvedRequests = await Request.find({ requestStatus: 'approved' });
        res.status(200).json({ data: approvedRequests });
    } catch (error) {
        console.error('Error getting approved requests:', error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}