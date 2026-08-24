import mongoose from "mongoose";

const cloudFileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "other",
    },
  },
  {
    timestamps: true,
  }
);

const CloudFile = mongoose.model("CloudFile", cloudFileSchema);
export default CloudFile;
