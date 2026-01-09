import Items from '../model/itemModel.js'

export const getItems = async (req, res) => {
    try {
        const { role } = req.query;
        let data;
        if (role) {
            data = await Items.findOne({ role });
        } else {
            data = await Items.find();
        }
        res.status(200).json({ data });
    } catch (error) {
        console.error("Get items error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addItem = async (req, res) => {
    try {
        const { role, displayName, itemName, itemCount } = req.body;

        if (!role || !displayName || !itemName || itemCount === undefined) {
            return res.status(400).json({ error: "Role, displayName, itemName, and itemCount are required" });
        }

        if (itemCount < 0) {
            return res.status(400).json({ error: "Item count cannot be negative" });
        }

        // Find existing document for this role
        let itemDoc = await Items.findOne({ role });

        if (itemDoc) {
            // Check if item already exists
            const existingItem = itemDoc.items.find(item => item.itemName === itemName);

            if (existingItem) {
                return res.status(400).json({ error: "Item already exists. Use update instead." });
            }

            // Add new item to existing document
            itemDoc.items.push({ itemName, itemCount });
            itemDoc.itemHistory.push({
                itemName,
                action: 'added',
                quantity: itemCount,
                date: new Date()
            });
            await itemDoc.save();
        } else {
            // Create new document for this role
            itemDoc = new Items({
                role,
                displayName,
                items: [{ itemName, itemCount }],
                itemHistory: [{
                    itemName,
                    action: 'added',
                    quantity: itemCount,
                    date: new Date()
                }]
            });
            await itemDoc.save();
        }

        res.status(201).json({
            message: "Item added successfully",
            data: itemDoc
        });
    } catch (error) {
        console.error("Add item error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateItem = async (req, res) => {
    try {
        const { role, displayName, itemName, itemCount } = req.body;

        if (!role || !displayName || !itemName || itemCount === undefined) {
            return res.status(400).json({ error: "Role, displayName, itemName, and itemCount are required" });
        }

        if (itemCount < 0) {
            return res.status(400).json({ error: "Item count cannot be negative" });
        }

        // Find document for this role
        const itemDoc = await Items.findOne({ role });

        if (!itemDoc) {
            return res.status(404).json({ error: "No items found for this role" });
        }

        // Find and update the specific item
        const itemIndex = itemDoc.items.findIndex(item => item.itemName === itemName);

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found" });
        }

        const previousQuantity = itemDoc.items[itemIndex].itemCount;
        itemDoc.items[itemIndex].itemCount = itemCount;
        itemDoc.itemHistory.push({
            itemName,
            action: 'updated',
            quantity: itemCount,
            previousQuantity,
            date: new Date()
        });
        await itemDoc.save();

        res.status(200).json({
            message: "Item updated successfully",
            data: itemDoc
        });
    } catch (error) {
        console.error("Update item error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getItemHistory = async (req, res) => {
    try {
        const { role } = req.query;

        if (!role) {
            return res.status(400).json({ error: "Role is required" });
        }

        const itemDoc = await Items.findOne({ role });

        if (!itemDoc) {
            return res.status(404).json({ error: "No items found for this role" });
        }

        // Return history sorted by date (newest first)
        const history = itemDoc.itemHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            data: history
        });
    } catch (error) {
        console.error("Get item history error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}