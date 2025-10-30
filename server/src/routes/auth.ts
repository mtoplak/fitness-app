import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserRole } from "../models/User.js";
import { env } from "../config/env.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body as {
      email: string;
      password: string;
      fullName: string;
      role?: UserRole;
    };

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, fullName, passwordHash, role: role || "member" });
    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn: "7d" });
    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn: "7d" });
    return res.json({
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;


