import { useEffect } from "react";
import { PenLine } from "lucide-react";
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
  onSelectType: (type: 'normal') => void;
}

export function RegisterTypeDialog({ open, onClose, onSelectType }: RegisterTypeDialogProps) {
  useEffect(() => {
    console.log('[RegisterTypeDialog] open prop changed to:', open);
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    console.log('[RegisterTypeDialog] onOpenChange called with:', isOpen);
    // open prop과 isOpen이 다를 때만 onClose 호출
    if (open && !isOpen) {
      console.log('[RegisterTypeDialog] Closing dialog');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>판매글 작성</DialogTitle>
          <DialogDescription>
            상품 정보를 입력하여 판매글을 작성해주세요
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
