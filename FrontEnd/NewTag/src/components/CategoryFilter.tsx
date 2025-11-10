import { useRef, useState, useEffect } from "react";
import { Smartphone, Sofa, ShoppingBag, Dumbbell, BookOpen, Grid3x3 } from "lucide-react";
import { Button } from "./ui/button";

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const categories = [
    { id: 'all', label: '전체', icon: Grid3x3 },
    { id: '1', label: '전자기기', icon: Smartphone },
    { id: '2', label: '가구/인테리어', icon: Sofa },
    { id: '3', label: '의류잡화', icon: ShoppingBag },
    { id: '4', label: '스포츠/레저', icon: Dumbbell },
    { id: '5', label: '도서', icon: BookOpen },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조정
    
    // 5px 이상 움직였다면 드래그로 인식
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // 약간의 지연 후 hasMoved 초기화 (클릭 이벤트가 처리된 후)
    setTimeout(() => setHasMoved(false), 100);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="w-full overflow-x-auto pb-2 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex gap-2 px-4 min-w-max">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selected === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                // 드래그 중이었다면 클릭 이벤트 무시
                if (hasMoved) {
                  e.preventDefault();
                  return;
                }
                onSelect(category.id);
              }}
              className={`flex items-center gap-2 ${
                isSelected 
                  ? 'bg-[#FF8F8F] text-white hover:bg-[#FF7A7A] border-[#FF8F8F]' 
                  : 'bg-background'
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
