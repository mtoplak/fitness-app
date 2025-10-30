import { Router } from "express";
import { GroupClass } from "../models/GroupClass.js";

const router = Router();

// GET /classes -> list all group classes
router.get("/", async (_req, res) => {
  try {
    const classes = await GroupClass.find({}).lean();
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

