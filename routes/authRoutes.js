import { Router } from "express";
import { login, register, forgotPassword, resetPassword } from "../controllers/authControllers.js";

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;