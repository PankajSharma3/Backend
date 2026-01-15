import Maintenance from "../model/maintenanceModel.js";
import Items from "../model/itemModel.js";

// Create a new maintenance request
export const createMaintenance = async (req, res) => {
    try {
        const { title, description, priority, displayName, submittedBy, itemName, quantity } = req.body;

        if (!title || !description || !displayName || !submittedBy || !itemName || !quantity) {
            return res.status(400).json({ error: "Please fill all required fields" });
        }

        // Verify inventory
        const blockInventory = await Items.findOne({ username: submittedBy });
        if (!blockInventory) {
            return res.status(404).json({ error: "Block Manager inventory not found" });
        }

        const item = blockInventory.items.find(i => i.itemName === itemName);
        if (!item) {
            return res.status(400).json({ error: "Item not found in your inventory" });
        }

        if (item.itemCount < quantity) {
            return res.status(400).json({ error: `Insufficient stock. You only have ${item.itemCount} of ${itemName}` });
        }

        const newMaintenance = new Maintenance({
            title,
            note: description,
            priority: priority || 'medium',
            displayName,
            submittedBy,
            itemName,
            quantity
        });

        await newMaintenance.save();

        res.status(201).json({
            message: "Maintenance request created successfully",
            data: newMaintenance
        });

    } catch (error) {
        console.error("Error creating maintenance request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get maintenance requests (can filter by role/username)
export const getMaintenance = async (req, res) => {
    try {
        const { role, username } = req.query; // If role is 'storeManager', get all. If 'blockManager', filter by username.

        let query = {};

        // If query param 'username' is provided, we filter by that (typical for block manager)
        if (username) {
            query.submittedBy = username;
        }

        // Sort by newest first
        const maintenanceList = await Maintenance.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            count: maintenanceList.length,
            data: maintenanceList
        });

    } catch (error) {
        console.error("Error fetching maintenance requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Update maintenance status (for Store Manager)
export const updateMaintenanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const maintenance = await Maintenance.findById(id);

        if (!maintenance) {
            return res.status(404).json({ error: "Maintenance request not found" });
        }

        if (status) maintenance.status = status;
        if (notes) maintenance.notes = notes;

        if (status === 'completed' && !maintenance.resolvedDate) {
            maintenance.resolvedDate = new Date();
        }

        await maintenance.save();

        res.status(200).json({
            message: "Maintenance status updated",
            data: maintenance
        });

    } catch (error) {
        console.error("Error updating maintenance status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
