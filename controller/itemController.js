
import Items from '../model/itemModel.js'
import User from '../model/userModel.js'

export const getItems = async (req, res) => {
    try {
        const { role, username } = req.query;
        let data;

        if (username) {
            // Search by username directly
            data = await Items.findOne({ username: username });
            // Patch displayName if missing
            if (data && !data.displayName) {
                const user = await User.findOne({ username: data.username });
                if (user && user.displayName) {
                    data.displayName = user.displayName;
                }
            }
        } else if (role) {
            // Search by role field (e.g., role=storeManager finds the store manager's inventory)
            data = await Items.findOne({ role: role });
            if (data && !data.displayName) {
                const user = await User.findOne({ username: data.username });
                if (user && user.displayName) {
                    data.displayName = user.displayName;
                }
            }
        } else {
            // Return all items if no filter
            data = await Items.find();
            // Patch displayName for all
            for (let doc of data) {
                if (!doc.displayName) {
                    const user = await User.findOne({ username: doc.username });
                    if (user && user.displayName) {
                        doc.displayName = user.displayName;
                    }
                }
            }
        }

        res.status(200).json({ data });
    } catch (error) {
        console.error("Get items error:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const addItem = async (req, res) => {
    try {
        const { role, username, displayName, itemName, itemCount } = req.body;
        const owner = username || role; // accept role for older clients

        console.log('Adding item:', { owner, displayName, itemName, itemCount });

        if (!owner || !displayName || !itemName || itemCount === undefined) {
            console.log('Missing required fields');
            return res.status(400).json({ error: "username (or role), displayName, itemName, and itemCount are required" });
        }

        if (itemCount < 0) {
            return res.status(400).json({ error: "Item count cannot be negative" });
        }

        // Find existing document for this role
        let itemDoc = await Items.findOne({ username: owner });

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
                username: owner,
                role: owner,
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
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const updateItem = async (req, res) => {
    try {
        const { role, username, displayName, itemName, itemCount } = req.body;
        const owner = username || role;

        if (!owner || !displayName || !itemName || itemCount === undefined) {
            return res.status(400).json({ error: "username (or role), displayName, itemName, and itemCount are required" });
        }

        if (itemCount < 0) {
            return res.status(400).json({ error: "Item count cannot be negative" });
        }

        // Find document for this role
        const itemDoc = await Items.findOne({ username: owner });

        if (!itemDoc) {
            return res.status(404).json({ error: "No items found for this username" });
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
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const getItemHistory = async (req, res) => {
    try {
        const { role, username } = req.query;
        const owner = username || role;

        if (!owner) {
            return res.status(400).json({ error: "username (or role) is required" });
        }

        const itemDoc = await Items.findOne({ username: owner });

        if (!itemDoc) {
            return res.status(404).json({ error: "No items found for this username" });
        }

        // Return history sorted by date (newest first)
        const history = itemDoc.itemHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            data: history
        });
    } catch (error) {
        console.error("Get item history error:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}