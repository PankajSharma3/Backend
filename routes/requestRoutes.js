import express from "express";
import { getRequests, updateRequestStatus, createRequest, getPendingRequests, getApprovedRequests, confirmRequestReceipt } from "../controller/requestController.js";
import { protectRoute } from "../middleware/protectRoutes.js";

const router = express.Router();

router.get('/', getRequests);
router.post('/', protectRoute, createRequest);
router.patch('/:id/status', protectRoute, updateRequestStatus);
router.patch('/:id/confirm', protectRoute, confirmRequestReceipt);
router.get('/pending', getPendingRequests);
router.get('/approved', getApprovedRequests);

export default router;