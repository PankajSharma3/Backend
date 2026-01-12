import Items from "../model/itemModel.js";

// Issue types that are considered "issues" in itemHistory
const ISSUE_ACTIONS = ['damaged', 'expired', 'returned'];

export const getIssues = async (req, res) => {
    try {
        const roleFromQuery = req.query.role || req.user?.username;

        // If no role specified, fetch ALL issues from ALL inventories (for admin)
        if (!roleFromQuery) {
            const allInventories = await Items.find({});
            const allIssues = [];

            for (const inventory of allInventories) {
                if (inventory.itemHistory && inventory.itemHistory.length > 0) {
                    const issues = inventory.itemHistory
                        .filter(entry => ISSUE_ACTIONS.includes(entry.action))
                        .map(entry => ({
                            _id: entry._id,
                            role: inventory.username,
                            displayName: inventory.displayName,
                            issueTitle: entry.itemName,
                            issueType: entry.action.charAt(0).toUpperCase() + entry.action.slice(1),
                            quantity: entry.previousQuantity - entry.quantity,
                            description: entry.description || '',
                            status: entry.status || 'pending',
                            resolution: entry.resolution || '',
                            resolvedDate: entry.resolvedDate,
                            createdAt: entry.date,
                            date: entry.date
                        }));
                    allIssues.push(...issues);
                }
            }

            // Sort all issues by date (newest first)
            allIssues.sort((a, b) => new Date(b.date) - new Date(a.date));

            return res.status(200).json({ data: allIssues });
        }

        // Find inventory document for this role
        const inventory = await Items.findOne({ username: roleFromQuery });
        if (!inventory) {
            return res.status(200).json({ data: [] });
        }

        // Filter itemHistory to get only issue entries (damaged, expired, returned)
        const issues = inventory.itemHistory
            .filter(entry => ISSUE_ACTIONS.includes(entry.action))
            .map(entry => ({
                _id: entry._id,
                role: roleFromQuery,
                displayName: inventory.displayName,
                issueTitle: entry.itemName,
                issueType: entry.action.charAt(0).toUpperCase() + entry.action.slice(1), // Capitalize
                quantity: entry.previousQuantity - entry.quantity, // The affected quantity
                description: entry.description || '',
                status: entry.status || 'pending',
                resolution: entry.resolution || '',
                resolvedDate: entry.resolvedDate,
                createdAt: entry.date,
                date: entry.date
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

        res.status(200).json({ data: issues });
    } catch (error) {
        console.error("Get issues error:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const addIssue = async (req, res) => {
    try {
        const { role, displayName, issueTitle, issueType, quantity, description } = req.body;
        const targetRole = role || req.user?.username;

        console.log('Adding issue:', { targetRole, displayName, issueTitle, issueType, quantity });

        if (!targetRole || !displayName || !issueTitle || !issueType || quantity === undefined) {
            console.log('Missing required fields');
            return res.status(400).json({ error: "Role, displayName, issueTitle, issueType, and quantity are required" });
        }
        if (quantity < 1) {
            return res.status(400).json({ error: "Quantity must be at least 1" });
        }

        // Find the inventory for this role
        const inventory = await Items.findOne({ username: targetRole });
        if (!inventory) {
            return res.status(404).json({ error: "Inventory not found for this role" });
        }

        // Find the specific item in the inventory
        const itemIndex = inventory.items.findIndex(item => item.itemName === issueTitle);
        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in inventory" });
        }

        const item = inventory.items[itemIndex];

        // Check if sufficient quantity is available
        if (item.itemCount < quantity) {
            return res.status(400).json({
                error: `Insufficient quantity. Available: ${item.itemCount}, Requested: ${quantity}`
            });
        }

        // Reduce the item count
        const previousCount = item.itemCount;
        inventory.items[itemIndex].itemCount -= quantity;

        // Add history entry as an issue
        const historyEntry = {
            itemName: issueTitle,
            action: issueType.toLowerCase(), // damaged, expired, returned
            quantity: inventory.items[itemIndex].itemCount,
            previousQuantity: previousCount,
            description: description || '',
            status: 'pending',
            date: new Date()
        };
        inventory.itemHistory.push(historyEntry);

        // Save the updated inventory
        await inventory.save();

        // Get the newly created entry (last one in array)
        const newEntry = inventory.itemHistory[inventory.itemHistory.length - 1];

        res.status(201).json({
            message: "Issue logged successfully and inventory updated",
            data: {
                _id: newEntry._id,
                role: targetRole,
                displayName: displayName,
                issueTitle,
                issueType,
                quantity,
                description: description || '',
                status: 'pending',
                createdAt: newEntry.date
            }
        });
    } catch (error) {
        console.error("Add issue error:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution, role } = req.body;
        const targetRole = role || req.query.role || req.user?.username;

        // Find the inventory
        const inventory = await Items.findOne({ username: targetRole });
        if (!inventory) {
            return res.status(404).json({ error: "Inventory not found" });
        }

        // Find the history entry by _id
        const entryIndex = inventory.itemHistory.findIndex(
            entry => entry._id.toString() === id
        );

        if (entryIndex === -1) {
            return res.status(404).json({ error: "Issue not found" });
        }

        // Update the entry
        if (status) {
            inventory.itemHistory[entryIndex].status = status;
        }
        if (resolution) {
            inventory.itemHistory[entryIndex].resolution = resolution;
        }
        if (status === 'resolved') {
            inventory.itemHistory[entryIndex].resolvedDate = new Date();
        }

        await inventory.save();

        const updatedEntry = inventory.itemHistory[entryIndex];

        res.status(200).json({
            message: "Issue updated successfully",
            data: {
                _id: updatedEntry._id,
                role: targetRole,
                displayName: inventory.displayName,
                issueTitle: updatedEntry.itemName,
                issueType: updatedEntry.action.charAt(0).toUpperCase() + updatedEntry.action.slice(1),
                quantity: updatedEntry.previousQuantity - updatedEntry.quantity,
                status: updatedEntry.status,
                resolution: updatedEntry.resolution,
                resolvedDate: updatedEntry.resolvedDate,
                createdAt: updatedEntry.date
            }
        });
    } catch (error) {
        console.error("Update issue error:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}

export const deleteIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const targetRole = req.query.role || req.user?.username;

        // Find the inventory
        const inventory = await Items.findOne({ username: targetRole });
        if (!inventory) {
            return res.status(404).json({ error: "Inventory not found" });
        }

        // Find and remove the history entry
        const entryIndex = inventory.itemHistory.findIndex(
            entry => entry._id.toString() === id
        );

        if (entryIndex === -1) {
            return res.status(404).json({ error: "Issue not found" });
        }

        inventory.itemHistory.splice(entryIndex, 1);
        await inventory.save();

        res.status(200).json({ message: "Issue deleted successfully" });
    } catch (error) {
        console.error("Delete issue error:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}