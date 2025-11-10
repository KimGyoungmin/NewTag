import { Search, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import { 
  getRecentSearches, 
  addRecentSearch, 
  removeRecentSearch, 
  clearRecentSearches 
} from "../utils/localStorage";

interface HeaderProps {
  onSearchClick?: () => void;
  onSearch?: (query: string) => void;
  onLogoClick?: () => void;
  onLoginClick?: () => void;
}

export function Header({ onSearchClick, onSearch, onLogoClick, onLoginClick }: HeaderProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize recent searches from local storage
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());

  // Activate search and focus input
  const handleSearchActivate = () => {
    setIsSearchActive(true);
  };

  // Close search overlay
  const handleSearchClose = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      // Add to recent searches
      addRecentSearch(query);
      setRecentSearches(getRecentSearches());
      
      // Navigate to search page with query
      if (onSearch) {
        onSearch(query);
      }
      
      handleSearchClose();
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearchSubmit(query);
  };

  // Remove a recent search
  const handleRemoveRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(query);
    setRecentSearches(getRecentSearches());
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchActive) {
        handleSearchClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSearchActive]);

  // Handle scroll state for auto-hiding scrollbar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Show scrollbar when scrolling
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Hide scrollbar after 500ms of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [showAllRecent]);

  // Handle header scroll for transparency effect
  useEffect(() => {
    const handleHeaderScroll = () => {
      if (window.scrollY > 10) {
        setIsHeaderScrolled(true);
      } else {
        setIsHeaderScrolled(false);
      }
    };

    window.addEventListener('scroll', handleHeaderScroll);
    return () => window.removeEventListener('scroll', handleHeaderScroll);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b shadow-sm transition-all duration-300 ${
        isHeaderScrolled 
          ? 'bg-[#5eead4]/80 backdrop-blur-md' 
          : 'bg-[#5eead4]'
      }`}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left - Login Button */}
          <div className="flex items-center w-auto md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoginClick}
              className="text-white hover:bg-white/20 text-xs md:text-sm"
            >
              로그인
            </Button>
          </div>

          {/* Center - Logo and Title */}
          <button 
            onClick={onLogoClick}
            className="hover:opacity-80 transition-opacity absolute left-1/2 -translate-x-1/2"
          >
            <span className="text-white">NewTag</span>
          </button>

          {/* Right - Search Icon */}
          <div className="flex items-center gap-2 w-12 md:w-16 justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-white/20 text-white"
              onClick={handleSearchActivate}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchActive && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleSearchClose}
          />
          
          {/* Search Content */}
          <div className="relative container mx-auto max-w-2xl px-4 pt-4 animate-in slide-in-from-top duration-300">
            <div className="bg-background rounded-2xl shadow-2xl border overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="상품명을 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleSearchSubmit(searchQuery)}
                  className="bg-primary hover:bg-primary-hover shrink-0"
                >
                  검색
                </Button>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && !searchQuery && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">최근 검색어</span>
                    </div>
                  </div>
                  <div 
                    ref={scrollContainerRef}
                    className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:transition-all [&::-webkit-scrollbar-thumb]:duration-300 ${
                      showAllRecent ? 'max-h-[400px] overflow-y-auto' : 'max-h-[200px]'
                    } ${
                      isScrolling 
                        ? '[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40' 
                        : '[&::-webkit-scrollbar-thumb]:bg-transparent'
                    }`}
                  >
                    {(showAllRecent ? recentSearches : recentSearches.slice(0, 3)).map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(query)}
                        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-secondary transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span>{query}</span>
                        </div>
                        <div
                          onClick={(e) => handleRemoveRecentSearch(query, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded cursor-pointer"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Show More Button */}
                  {recentSearches.length > 3 && (
                    <button
                      onClick={() => setShowAllRecent(!showAllRecent)}
                      className="flex items-center justify-center gap-2 w-full mt-3 p-2 rounded-lg hover:bg-secondary/50 transition-all duration-200 text-sm text-muted-foreground hover:text-foreground group"
                    >
                      <span>{showAllRecent ? '접기' : `더보기 (${recentSearches.length - 3}개)`}</span>
                      {showAllRecent ? (
                        <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Empty State */}
              {recentSearches.length === 0 && !searchQuery && (
                <div className="p-8 text-center">
                  <div className="mb-3 text-4xl">🔍</div>
                  <p className="text-sm text-muted-foreground">
                    최근 검색어가 없습니다
                  </p>
                </div>
              )}

              {/* Search Suggestions (when typing) */}
              {searchQuery && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => handleSearchSubmit(searchQuery)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Search className="h-4 w-4 text-primary" />
                    <span>
                      <span className="text-primary">{searchQuery}</span>
                      <span className="text-muted-foreground"> 검색</span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Close hint */}
            <div className="text-center mt-4">
              <button
                onClick={handleSearchClose}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                ESC를 누르거나 배경을 클릭하면 닫힙니다
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}