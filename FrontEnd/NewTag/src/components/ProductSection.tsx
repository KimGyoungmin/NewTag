import { ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  timeAgo: string;
  likes: number;
  chatCount: number;
  status?: 'available' | 'reserved' | 'sold';
}

interface ProductSectionProps {
  title: string;
  description?: string;
  products: Product[];
  icon?: React.ReactNode;
  onViewAll?: () => void;
  onProductClick: (productId: string) => void;
  layout?: 'grid' | 'scroll';
}

export function ProductSection({ 
  title, 
  description, 
  products, 
  icon,
  onViewAll,
  onProductClick,
  layout = 'scroll'
}: ProductSectionProps) {
  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <div>
              <h2>{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {onViewAll && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onViewAll}
              className="text-muted-foreground hover:text-foreground"
            >
              전체보기
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Products */}
        {layout === 'scroll' ? (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
              {products.map((product) => (
                <div key={product.id} className="w-[160px] md:w-[200px]">
                  <ProductCard
                    {...product}
                    onClick={() => onProductClick(product.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => onProductClick(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
