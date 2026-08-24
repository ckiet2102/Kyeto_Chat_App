import mongoose from "mongoose";

const channelPostSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrls: [{ type: String }],
    viewsCount: {
      type: Number,
      default: 0,
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const ChannelPost = mongoose.model("ChannelPost", channelPostSchema);
export default ChannelPost;
