import Issue from "../model/issueModel.js";
import Items from "../model/itemModel.js";

export const getIssues = async (req, res) => {
    try {
        const roleFromQuery = req.query.role || req.user?.username;
        const filter = roleFromQuery ? { role: roleFromQuery } : {};
        const issues = await Issue.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ data: issues });
    } catch (error) {
        console.error("Get issues error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addIssue = async (req, res) => {
    try {
        const { role, issueTitle, issueType, quantity, description } = req.body;
        const targetRole = role || req.user?.username;

        if (!targetRole || !issueTitle || !issueType || quantity === undefined) {
            return res.status(400).json({ error: "Role, issueTitle, issueType, and quantity are required" });
        }
        if (quantity < 1) {
            return res.status(400).json({ error: "Quantity must be at least 1" });
        }

        // Find the inventory for this block/store
        const inventory = await Items.findOne({ role: targetRole });
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

        // Add history entry with appropriate action based on issue type
        const historyEntry = {
            itemName: issueTitle,
            action: issueType === 'Used' ? 'consumed' : 'updated',
            quantity: inventory.items[itemIndex].itemCount,
            previousQuantity: previousCount,
            date: new Date()
        };
        inventory.itemHistory.push(historyEntry);

        // Save the updated inventory
        await inventory.save();

        // Create the issue
        const newIssue = new Issue({
            role: targetRole,
            issueTitle,
            issueType,
            quantity,
            title: issueTitle, // align with schema requirement
            description: description || "",
            reportedBy: req.user?.username || "Unknown"
        });
        await newIssue.save();

        res.status(201).json({
            message: "Issue logged successfully and inventory updated",
            data: newIssue
        });
    } catch (error) {
        console.error("Add issue error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;

        const issue = await Issue.findById(id);
        if (!issue) {
            return res.status(404).json({ error: "Issue not found" });
        }

        if (status) {
            issue.status = status;
        }
        if (resolution) {
            issue.resolution = resolution;
        }
        if (status === 'resolved') {
            issue.resolvedDate = new Date();
        }

        await issue.save();

        res.status(200).json({
            message: "Issue updated successfully",
            data: issue
        });
    } catch (error) {
        console.error("Update issue error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}