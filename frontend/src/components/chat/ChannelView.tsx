import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Radio, Send, Eye, CheckCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface ChannelViewProps {
  channel: any;
}

export default function ChannelView({ channel }: ChannelViewProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [sending, setSending] = useState(false);

  const fetchPosts = async () => {
    if (!channel?._id) return;
    try {
      setLoading(true);
      const res = await api.get(`/channels/${channel._id}/posts`, { withCredentials: true });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải bài đăng của Kênh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [channel?._id]);

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    try {
      setSending(true);
      const res = await api.post(
        `/channels/${channel._id}/posts`,
        { title: postTitle.trim(), content: postContent.trim() },
        { withCredentials: true }
      );
      setPosts([res.data.post, ...posts]);
      setPostContent("");
      setPostTitle("");
      toast.success("Đã đăng thông báo lên Kênh!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể đăng bài lên Kênh");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Channel Header Banner */}
      <div className="p-4 border-b border-border/40 bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Radio className="size-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-foreground">{channel.name}</h3>
              {channel.isVerified && <CheckCircle className="size-4 text-sky-500 fill-sky-500/20" />}
            </div>
            <span className="text-xs text-muted-foreground font-mono">@{channel.handle} • {channel.subscribersCount || 1} người theo dõi</span>
          </div>
        </div>

        <Button size="sm" className="gap-1.5 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="size-4" /> Theo dõi Kênh
        </Button>
      </div>

      {/* Broadcast Post Composer (For Channel Owners) */}
      <div className="p-4 border-b border-border/40 bg-muted/20 space-y-2">
        <Input
          placeholder="Tiêu đề bài thông báo..."
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          className="text-xs h-9 bg-card"
        />
        <div className="flex items-center gap-2">
          <Input
            placeholder="Viết nội dung phát sóng tới toàn bộ người theo dõi..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreatePost()}
            className="text-xs h-9 bg-card"
          />
          <Button size="icon" onClick={handleCreatePost} disabled={sending || !postContent.trim()} className="size-9 rounded-xl shrink-0">
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 beautiful-scrollbar">
        {loading ? (
          <p className="text-center text-xs text-muted-foreground py-8">Đang tải bản tin...</p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs">
            <Radio className="size-8 text-muted-foreground/40 mb-2" />
            Chưa có bài thông báo nào trên kênh này.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3">
              {post.title && <h4 className="font-bold text-sm text-foreground">{post.title}</h4>}
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{post.content}</p>
              
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/30">
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" /> {post.viewsCount || 1} lượt xem
                </span>
                <span>
                  {post.createdAt
                    ? (() => {
                        const d = new Date(post.createdAt);
                        return isNaN(d.getTime())
                          ? ""
                          : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
                      })()
                    : ""}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
