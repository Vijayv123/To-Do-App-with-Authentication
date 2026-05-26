import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    labelColor: {
      type: String,
      enum: ["blue", "green", "rose", "amber"],
      default: "blue"
    },
    labelName: {
      type: String,
      enum: ["Work", "Personal", "Urgent", "Do Later"],
      default: "Work",
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Todo", todoSchema);
