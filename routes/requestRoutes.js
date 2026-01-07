import express from "express";
import { getRequests, updateRequestStatus, createRequest, getPendingRequests, getApprovedRequests } from "../controller/requestController.js";
import { protectRoute } from "../middleware/protectRoutes.js";

const router = express.Router();

router.get('/', getRequests);
router.post('/', protectRoute, createRequest);
router.patch('/:id/status', protectRoute, updateRequestStatus);
router.get('/pending', getPendingRequests);
router.get('/approved', getApprovedRequests);

export default router;