import { Sparkles } from "lucide-react";

interface SmartReplyChipsProps {
  onSelectReply: (replyText: string) => void;
}

const SUGGESTIONS = [
  "Cảm ơn bạn! 👍",
  "Mình đồng ý nhé 👌",
  "Đã nhận thông tin 📩",
  "Để mình kiểm tra lại nhé 🧐",
  "Hẹn gặp lại bạn sau! 👋",
];

export default function SmartReplyChips({ onSelectReply }: SmartReplyChipsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 beautiful-scrollbar animate-in fade-in slide-in-from-bottom-1">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-primary shrink-0 px-2 py-1 bg-primary/10 rounded-full border border-primary/20">
        <Sparkles className="size-3 text-amber-500" />
        Gợi ý AI:
      </div>
      {SUGGESTIONS.map((text, idx) => (
        <button
          key={idx}
          onClick={() => onSelectReply(text)}
          className="text-xs font-medium px-3 py-1 rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary transition-all shrink-0 border border-border/40"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
