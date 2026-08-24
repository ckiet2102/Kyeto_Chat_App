import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Cloud, FileText, Image as ImageIcon, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

interface CloudStorageModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CloudStorageModal({ open, setOpen }: CloudStorageModalProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadCloudFiles();
    }
  }, [open]);

  const loadCloudFiles = async () => {
    try {
      setLoading(true);
      const data = await chatService.getCloudFiles();
      setFiles(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const newFile = await chatService.uploadCloudFile(formData);
      setFiles((prev) => [newFile, ...prev]);
      toast.success("Tải tệp lên Cloud thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải file lên Cloud");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/40 select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-bold text-foreground">
            <div className="flex items-center gap-2">
              <Cloud className="size-5 text-sky-500" />
              Kyeto Cloud Storage
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-8 gap-1 rounded-xl text-xs bg-primary text-primary-foreground"
              >
                <Upload className="size-3.5" />
                {uploading ? "Đang tải..." : "Tải lên"}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kho lưu trữ dữ liệu cá nhân an toàn của bạn.
          </DialogDescription>
        </DialogHeader>

        {/* Files List */}
        <div className="space-y-2 my-2 max-h-[300px] overflow-y-auto beautiful-scrollbar pr-1">
          {loading ? (
            <p className="text-xs text-center py-6 text-muted-foreground">Đang tải Cloud storage...</p>
          ) : files.length > 0 ? (
            files.map((file) => (
              <div
                key={file._id}
                className="p-2.5 rounded-2xl bg-muted/30 hover:bg-muted/60 transition-smooth border border-border/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {file.fileType === "image" || file.fileType === "png" || file.fileType === "jpg" ? (
                      <ImageIcon className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">{file.fileName}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {file.fileSize} • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                  title="Tải về"
                >
                  <Download className="size-4" />
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-xs text-muted-foreground">
              <Cloud className="size-10 mx-auto mb-2 opacity-40" />
              Chưa có tệp tin nào được tải lên Cloud.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CloudStorageModal;
