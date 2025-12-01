import { useRef, useState, useEffect } from "react";
import { Smartphone, Sofa, ShoppingBag, Dumbbell, BookOpen, Grid3x3, Sparkles, UtensilsCrossed, Baby, Footprints, Package, LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { categoryApi } from "../api/categoryApi";

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

// 카테고리 이름에 따라 아이콘 매핑
const getCategoryIcon = (categoryNm: string): LucideIcon => {
  if (categoryNm.includes('디지털') || categoryNm.includes('전자')) return Smartphone;
  if (categoryNm.includes('가구') || categoryNm.includes('인테리어')) return Sofa;
  if (categoryNm.includes('의류') || categoryNm.includes('패션') || categoryNm.includes('잡화')) return ShoppingBag;
  if (categoryNm.includes('스포츠') || categoryNm.includes('레저')) return Dumbbell;
  if (categoryNm.includes('도서') || categoryNm.includes('티켓') || categoryNm.includes('음반')) return BookOpen;
  if (categoryNm.includes('뷰티') || categoryNm.includes('미용')) return Sparkles;
  if (categoryNm.includes('생활') || categoryNm.includes('주방')) return UtensilsCrossed;
  if (categoryNm.includes('유아') || categoryNm.includes('출산')) return Baby;
  if (categoryNm.includes('반려') || categoryNm.includes('동물')) return Footprints;
  return Package; // 기본 아이콘
};

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; label: string; icon: LucideIcon }>>([
    { id: 'all', label: '전체', icon: Grid3x3 }
  ]);
  const [loading, setLoading] = useState(true);

  // 카테고리 데이터 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoryApi.getAllCategories();

        // API 데이터를 컴포넌트 형식으로 변환
        const categoryList = [
          { id: 'all', label: '전체', icon: Grid3x3 },
          ...data.map(cat => ({
            id: cat.id.toString(),
            label: cat.categoryNm,
            icon: getCategoryIcon(cat.categoryNm)
          }))
        ];

        setCategories(categoryList);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // 에러 시 기본 카테고리 유지
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
