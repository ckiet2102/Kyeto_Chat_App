import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ScheduleMessagePickerProps {
  onScheduleSelect: (scheduledDate: Date | null) => void;
  scheduledDate: Date | null;
}

export default function ScheduleMessagePicker({
  onScheduleSelect,
  scheduledDate,
}: ScheduleMessagePickerProps) {
  const [open, setOpen] = useState(false);
  const [datetimeStr, setDatetimeStr] = useState("");

  const handleApply = () => {
    if (!datetimeStr) {
      onScheduleSelect(null);
      setOpen(false);
      return;
    }

    const selected = new Date(datetimeStr);
    if (isNaN(selected.getTime())) {
      toast.error("Thời gian không hợp lệ");
      return;
    }

    if (selected.getTime() <= Date.now() + 60000) {
      toast.warning("Thời gian hẹn giờ phải sau ít nhất 1 phút");
      return;
    }

    onScheduleSelect(selected);
    toast.success(`Đã hẹn giờ gửi vào: ${selected.toLocaleString("vi-VN")}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={scheduledDate ? "default" : "ghost"}
          size="icon"
          className={`size-9 rounded-xl ${
            scheduledDate ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
          title={scheduledDate ? `Đã hẹn: ${scheduledDate.toLocaleString()}` : "Hẹn giờ gửi"}
        >
          <Clock className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-xl" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="size-4 text-amber-500" />
            Hẹn giờ gửi tin nhắn
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Chọn ngày & giờ gửi</label>
            <Input
              type="datetime-local"
              value={datetimeStr}
              onChange={(e) => setDatetimeStr(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {scheduledDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onScheduleSelect(null);
                  setDatetimeStr("");
                  setOpen(false);
                }}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                Hủy hẹn giờ
              </Button>
            )}
            <Button size="sm" onClick={handleApply} className="text-xs ml-auto">
              Áp dụng
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
