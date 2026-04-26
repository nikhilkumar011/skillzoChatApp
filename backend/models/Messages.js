const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: String,
  fileUrl: String,
  fileType: String,
  time: Number,
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);