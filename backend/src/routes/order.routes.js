import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createOrder,
  confirmOrder,
  confirmMomoOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestRefund,
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
router.post("/:id/confirm-momo", authenticate, mongoIdValidation, confirmMomoOrder);
router.patch("/:id/cancel", authenticate, mongoIdValidation, cancelOrder);
router.post("/:id/refund", authenticate, mongoIdValidation, requestRefund);

export default router;
