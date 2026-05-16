import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createOrder,
  confirmOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller.js";
import {
  orderValidation,
  paginationValidation,
  mongoIdValidation,
} from "../validators/index.js";

const router = express.Router();

router.get("/", authenticate, paginationValidation, getMyOrders);
router.get("/:id", authenticate, mongoIdValidation, getOrderById);
router.post("/", authenticate, orderValidation, createOrder);
router.post("/confirm", authenticate, confirmOrder);
router.patch("/:id/cancel", authenticate, mongoIdValidation, cancelOrder);

export default router;
