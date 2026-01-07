import express from "express";
import { getIssues, addIssue } from "../controller/issueController.js";
import { protectRoute } from "../middleware/protectRoutes.js";

const router = express.Router();

router.get('/', getIssues);
router.post('/add', protectRoute, addIssue);

export default router;