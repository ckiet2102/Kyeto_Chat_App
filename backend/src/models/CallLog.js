import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected"],
      default: "completed",
    },
    duration: {
      type: String,
      default: "00:00",
    },
  },
  {
    timestamps: true,
  }
);

const CallLog = mongoose.model("CallLog", callLogSchema);
export default CallLog;
