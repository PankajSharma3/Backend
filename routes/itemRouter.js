import express from "express";
import { getItems, updateItem, addItem, getItemHistory } from "../controller/itemController.js";
import { protectRoute } from "../middleware/protectRoutes.js";

const router = express.Router();

router.get('/', getItems);
router.get('/history', getItemHistory);
router.post('/add', protectRoute, addItem);
router.put('/update', protectRoute, updateItem);

export default router;