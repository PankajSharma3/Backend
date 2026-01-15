import express from "express";
import { createMaintenance, getMaintenance, updateMaintenanceStatus } from "../controller/maintenanceController.js";
import { protectRoute } from "../middleware/protectRoutes.js";

const router = express.Router();

router.post("/", protectRoute, createMaintenance);
router.get("/", protectRoute, getMaintenance);
router.patch("/:id", protectRoute, updateMaintenanceStatus);

export default router;
