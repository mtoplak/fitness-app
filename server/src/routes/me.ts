import { Router } from "express";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticateJwt, (req: AuthRequest, res) => {
  const user = req.user!;
  return res.json({
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });
});

export default router;


