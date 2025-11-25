import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera } from "lucide-react";
import { UserProfile } from "../utils/localStorage";
import { userApi } from "../api/userApi";
import { toast } from "sonner";
import { resolveImageUrl } from "../utils/image";

interface ProfileEditDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export function ProfileEditDialog({
  open,
  onClose,
  profile,
  onSave,
}: ProfileEditDialogProps) {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 다이얼로그 열릴 때마다 최신 프로필로 초기화
  useEffect(() => {
    if (open) {
      setEditedProfile(profile);
    }
  }, [open, profile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const result = await userApi.uploadProfileImage(file);
        if (result.success) {
          setEditedProfile({
            ...editedProfile,
            profileImage: resolveImageUrl(result.url),
          });
          toast.success("프로필 사진이 업로드되었습니다.");
        } else {
          toast.error("프로필 사진 업로드에 실패했습니다.");
        }
      } catch (err: any) {
        toast.error(err?.message || "프로필 사진 업로드 중 오류가 발생했습니다.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = () => {
    onSave(editedProfile);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
          <DialogDescription>프로필 정보를 수정하세요.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={editedProfile.profileImage} />
                <AvatarFallback>{editedProfile.name[0]}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              클릭하여 프로필 사진 변경
            </p>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={editedProfile.name}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, name: e.target.value })
              }
            />
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              value={editedProfile.nickname}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, nickname: e.target.value })
              }
            />
          </div>

          {/* 휴대폰 번호 */}
          <div className="space-y-2">
            <Label htmlFor="phone">휴대폰 번호</Label>
            <Input
              id="phone"
              type="tel"
              value={editedProfile.phone || ""}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, phone: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? "업로드 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
