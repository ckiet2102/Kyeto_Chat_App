import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Vote, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface PollCreatorProps {
  conversationId: string;
}

export default function PollCreator({ conversationId }: PollCreatorProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.warning("Tối đa 6 lựa chọn bình chọn");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning("Cần tối thiểu 2 lựa chọn");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi bình chọn");
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error("Vui lòng điền ít nhất 2 lựa chọn");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        `/conversations/${conversationId}/polls`,
        { question: question.trim(), options: validOptions },
        { withCredentials: true }
      );
      toast.success("Đã tạo cuộc bình chọn!");
      setOpen(false);
      setQuestion("");
      setOptions(["", ""]);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tạo cuộc bình chọn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-muted text-muted-foreground" title="Tạo cuộc bình chọn">
          <Vote className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Vote className="size-5 text-primary" />
            Tạo cuộc bình chọn mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Câu hỏi bình chọn</label>
            <Input
              placeholder="VD: Chúng ta sẽ đi đâu ăn trưa?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Các lựa chọn</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={`Lựa chọn ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleRemoveOption(idx)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full gap-1.5 border-dashed mt-2">
                <Plus className="size-4" />
                Thêm lựa chọn
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleCreatePoll} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo bình chọn"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
