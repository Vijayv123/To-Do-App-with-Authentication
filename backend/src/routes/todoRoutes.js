import { Router } from "express";
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo
} from "../controllers/todoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
