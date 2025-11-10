import { Sparkles, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface RegisterTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: 'normal' | 'ai') => void;
}

export function RegisterTypeDialog({ open, onClose, onSelectType }: RegisterTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>판매글 작성 방법 선택</DialogTitle>
          <DialogDescription>
            어떤 방식으로 판매글을 작성하시겠어요?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 hover:bg-primary/5 hover:border-primary"
            onClick={() => {
              onSelectType('normal');
              onClose();
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <PenLine className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="mb-1">일반 작성</div>
                <p className="text-sm text-muted-foreground">
                  직접 상품 정보를 입력합니다
                </p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 hover:bg-primary/5 hover:border-primary"
            onClick={() => {
              onSelectType('ai');
              onClose();
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="mb-1 flex items-center gap-2">
                  <span>AI 자동 작성</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                    NEW
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  사진만 올리면 AI가 자동으로 작성해드려요
                </p>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
