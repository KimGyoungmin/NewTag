import { useRef, useState, useEffect } from "react";
import { Button } from "./ui/button";

interface BrandFilterProps {
  brands: string[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
}

export function BrandFilter({ brands, selectedBrands, onToggleBrand }: BrandFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

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
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {brands.map((brand) => {
        const isSelected = selectedBrands.includes(brand);
        
        return (
          <Button
            key={brand}
            variant="outline"
            size="sm"
            onClick={(e) => {
              if (hasMoved) {
                e.preventDefault();
                return;
              }
              onToggleBrand(brand);
            }}
            className={`shrink-0 ${
              isSelected
                ? 'bg-[#FF8F8F] text-white hover:bg-[#FF7A7A] border-[#FF8F8F]'
                : ''
            }`}
          >
            #{brand}
          </Button>
        );
      })}
    </div>
  );
}
