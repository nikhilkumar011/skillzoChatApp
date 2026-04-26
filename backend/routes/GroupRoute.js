const express = require("express");
const Group = require("../models/Groups.js");

const router = express.Router();

// ✅ Create group
router.post("/create", async (req, res) => {
  try {
    const { name, category, adminId } = req.body;

    if (!name || !adminId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const group = await Group.create({
      name,
      category,
      admin: adminId,
      members: [adminId],
    });

    res.status(201).json(group);
  } catch (err) {
    console.error("CREATE ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all groups
router.get("/all", async (req, res) => {
  try {
    const groups = await Group.find().populate("admin", "email");
    res.json(groups);
  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Join group
router.post("/join", async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res.status(400).json({ message: "Missing data" });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ FIX ObjectId comparison
    const alreadyMember = group.members.some(
      (m) => m.toString() === userId
    );

    if (!alreadyMember) {
      group.members.push(userId);
      await group.save();
    }

    res.json(group);
  } catch (err) {
    console.error("JOIN ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post("/leave", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    res.json({ message: "Left group" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;