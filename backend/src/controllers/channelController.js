import Channel from "../models/Channel.js";
import ChannelPost from "../models/ChannelPost.js";

export const createChannel = async (req, res) => {
  try {
    const { name, handle, description } = req.body;
    const ownerId = req.user._id;

    const existing = await Channel.findOne({ handle: handle.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Handle tên kênh này đã được sử dụng" });
    }

    const channel = await Channel.create({
      name,
      handle: handle.toLowerCase(),
      description,
      ownerId,
      subscribersCount: 1,
    });

    return res.status(201).json({ channel });
  } catch (error) {
    console.error("Lỗi createChannel:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo kênh" });
  }
};

export const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find().populate("ownerId", "displayName avatarUrl").limit(20);
    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Lỗi getChannels:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách kênh" });
  }
};

export const getChannelPosts = async (req, res) => {
  try {
    const { channelId } = req.params;
    const posts = await ChannelPost.find({ channelId })
      .sort({ createdAt: -1 })
      .populate("authorId", "displayName avatarUrl");
    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Lỗi getChannelPosts:", error);
    return res.status(500).json({ message: "Lỗi lấy bài đăng kênh" });
  }
};

export const createChannelPost = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { title, content, mediaUrls } = req.body;
    const authorId = req.user._id;

    const post = await ChannelPost.create({
      channelId,
      authorId,
      title,
      content,
      mediaUrls: mediaUrls || [],
    });

    await post.populate("authorId", "displayName avatarUrl");
    return res.status(201).json({ post });
  } catch (error) {
    console.error("Lỗi createChannelPost:", error);
    return res.status(500).json({ message: "Lỗi tạo bài đăng" });
  }
};
