import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Vote, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/axios";

interface PollOption {
  _id?: string;
  text: string;
  votes: string[];
}

interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  isClosed?: boolean;
}

interface PollMessageProps {
  poll: Poll;
  conversationId: string;
}

export default function PollMessage({ poll, conversationId }: PollMessageProps) {
  const { user } = useAuthStore();
  const [currentPoll, setCurrentPoll] = useState<Poll>(poll);
  const [voting, setVoting] = useState(false);

  const totalVotes = currentPoll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  const handleVote = async (optionIndex: number) => {
    if (currentPoll.isClosed) return;

    try {
      setVoting(true);
      const res = await api.post(
        `/conversations/${conversationId}/polls/${currentPoll._id}/vote`,
        { optionIndex },
        { withCredentials: true }
      );
      setCurrentPoll(res.data.poll);
      toast.success("Đã bình chọn!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể bình chọn");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Vote className="size-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground leading-tight">{currentPoll.question}</h4>
          <span className="text-[11px] text-muted-foreground">{totalVotes} lượt bình chọn</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {currentPoll.options.map((option, idx) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVoted = user && option.votes?.some((v) => (typeof v === "object" ? (v as any)._id === user._id : v === user._id));

          return (
            <button
              key={idx}
              disabled={voting || currentPoll.isClosed}
              onClick={() => handleVote(idx)}
              className={cn(
                "relative w-full text-left p-2.5 rounded-xl border transition-all overflow-hidden flex items-center justify-between group",
                hasVoted
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/40 hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              {/* Progress bar background */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-20",
                  hasVoted ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center gap-2 min-w-0 pr-2">
                {hasVoted && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                <span className="text-xs font-medium text-foreground truncate">{option.text}</span>
              </div>

              <span className="relative z-10 text-[11px] font-bold text-muted-foreground shrink-0">
                {percentage}% ({voteCount})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
