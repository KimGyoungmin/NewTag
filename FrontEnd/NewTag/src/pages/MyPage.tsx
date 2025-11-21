import { ChevronRight, Settings, Heart, Package, ShoppingBag, Star, Bell, HelpCircle, FileText, ArrowLeft, Trash2, MoreVertical, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { MyProductCard } from "../components/MyProductCard";
import { ProfileEditDialog } from "../components/ProfileEditDialog";
import { ReviewDialog } from "../components/ReviewDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { useState, useEffect } from "react";
import {
    // 로컬 저장소 관련 함수 중 백엔드 연동 후에도 필요한 함수는 남겨둡니다.
    setUserProfile,
    setProductStatus,
    deleteProduct,
    isProductDeleted,
    ProductStatus, // ProductStatus 타입은 남겨둡니다.
    getTimeAgo,
    toggleProductVisibility,
    isProductHidden,
    // getUserProfile, getFavorites, getRegisteredProducts 등 데이터 조회 함수는 제거합니다.
} from "../utils/localStorage";
import { authApi } from "../api/auth";
import { toast } from "sonner";
// 가상의 API 함수 (실제 프로젝트에서는 별도로 구현 필요)
import { mypageApi } from "../api/mypage"; 

// =========================================================================
// 타입 정의 (백엔드 응답 형태에 맞춰 정의)
// =========================================================================

interface UserProfileData {
    id: string;
    name: string;
    image: string;
    rating: number;
    reviewCount: number;
    location: string;
}

interface Product {
    id: string;
    image: string;
    title: string;
    price: number;
    location: string;
    timeAgo: string;
    likes: number;
    chatCount: number;
    status: ProductStatus;
    createdAt: string; // 상대 시간 계산을 위해 필요
}

interface PurchaseItem {
    id: string;
    image: string;
    title: string;
    price: number;
    purchaseDate: string;
    // ... 기타 필드 (location, status 등)
}

interface Review {
    id: string;
    reviewer: string;
    reviewerImage: string;
    rating: number;
    comment: string;
    productTitle: string;
    date: string;
}

interface MyPageProps {
    onNavigate: (page: string, productId?: string) => void;
}

export function MyPage({ onNavigate }: MyPageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // 백엔드에서 받아올 데이터 상태
    const [user, setUser] = useState<UserProfileData | null>(null);
    const [userProfile, setUserProfileState] = useState<any>(null); // 프로필 수정 다이얼로그용
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    // 기타 상태
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<PurchaseItem | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [productStatuses, setProductStatuses] = useState<Record<string, ProductStatus>>({});
    const [dateFilter, setDateFilter] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all');
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);


    // =========================================================================
    // 데이터 로딩 (useEffect)
    // =========================================================================
    useEffect(() => {
        const fetchMyPageData = async () => {
            setIsLoading(true);
            try {
                // 1. 프로필 정보 (user)
                const profileData = await mypageApi.getProfile();
                setUser(profileData);
                setUserProfileState(profileData); // 프로필 수정 다이얼로그용 상태 초기화

                // 2. 판매 등록 상품
                const registeredProducts = await mypageApi.getRegisteredProducts();
                const processedProducts = registeredProducts.map((p: Product) => ({
                    ...p,
                    timeAgo: getTimeAgo(p.createdAt), // 서버에서 ISO 시간 문자열을 받아 상대 시간으로 변환
                }));
                setMyProducts(processedProducts);

                // 3. 관심 목록
                const favoritesList = await mypageApi.getFavorites();
                setWishlistItems(favoritesList);

                // 4. 구매 내역
                const history = await mypageApi.getPurchaseHistory();
                setPurchaseHistory(history);

                // 5. 받은 후기
                const receivedReviews = await mypageApi.getReviews();
                setReviews(receivedReviews);

                // 6. 상품 상태 초기화 (myProducts 로드 후 수행)
                const initialStatuses: Record<string, ProductStatus> = {};
                registeredProducts.forEach((product: Product) => {
                    // 백엔드에서 받은 초기 상태를 사용
                    initialStatuses[product.id] = product.status; 
                });
                setProductStatuses(initialStatuses);
                
            } catch (error) {
                console.error("마이페이지 데이터 로딩 실패:", error);
                toast.error("마이페이지 데이터를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyPageData();
    }, []);

    // activeSection이 변경될 때마다 찜 목록을 다시 불러오는 로직은, 
    // 백엔드 연동 환경에서는 필요에 따라 `activeSection === 'wishlist'`일 때만 
    // 별도의 API 호출로 대체하거나, 한 번에 로드된 데이터를 사용합니다.
    // 여기서는 초기 로드된 데이터를 사용한다고 가정하고 이 useEffect는 제거했습니다.
    // =========================================================================


    // =========================================================================
    // 핸들러 함수 (API 호출로 변경될 부분)
    // =========================================================================
    const handleProfileSave = async (profile: UserProfileData) => {
        try {
            // 백엔드 API 호출: 프로필 업데이트
            const updatedProfile = await mypageApi.updateProfile(profile); 
            setUser(updatedProfile);
            setUserProfileState(updatedProfile);
            setUserProfile(updatedProfile); // 로컬 저장소 함수는 필요하다면 유지
            toast.success("프로필이 성공적으로 업데이트되었습니다.");
        } catch (error) {
            toast.error("프로필 업데이트에 실패했습니다.");
        }
    };

    



const handleStatusChange = async (productId: string, newStatus: ProductStatus) => {
    try {
        // [수정] 백엔드 API 호출: 상품 상태 업데이트
        await mypageApi.updateProductStatus(productId, newStatus); 
        
        // 상태 업데이트는 API 성공 후에만 진행합니다.
        setProductStatuses(prev => ({
            ...prev,
            [productId]: newStatus
        }));
        toast.success(`상품 상태가 ${newStatus}로 변경되었습니다.`);
    } catch (error) {
        console.error("상품 상태 변경 실패:", error);
        toast.error("상품 상태 변경에 실패했습니다.");
    }
};

const handleDeleteProduct = async (productId: string) => { // [async 추가]
    try {
        // [수정] 백엔드 API 호출: 상품 삭제
        await mypageApi.deleteProduct(productId); 
        
        // 로컬 저장소 함수는 필요 없다면 제거 가능하나, 여기서는 유지
        deleteProduct(productId); 
        setProductToDelete(null);
        
        // 삭제된 상품을 상태에서 제거하여 UI를 업데이트합니다.
        setMyProducts(prev => prev.filter(p => p.id !== productId));
        toast.success("상품이 삭제되었습니다.");
    } catch (error) {
        console.error("상품 삭제 실패:", error);
        toast.error("상품 삭제에 실패했습니다.");
    }
};
    // =========================================================================


    const menuItems = [
        { icon: Heart, label: '관심 목록', count: wishlistItems.length, id: 'wishlist' },
        { icon: ShoppingBag, label: '구매 내역', count: purchaseHistory.length, id: 'purchase' },
        { icon: Star, label: '받은 후기', count: reviews.length, id: 'reviews' },
    ];

    const settingItems = [
        { icon: Bell, label: '알림 설정' },
        { icon: HelpCircle, label: '고객센터' },
        { icon: FileText, label: '이용약관' },
        { icon: Settings, label: '설정' },
    ];
    
    // 로딩 중 표시
    if (isLoading || user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center text-lg text-muted-foreground">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    데이터를 불러오는 중입니다...
                </div>
            </div>
        );
    }

  //function handleLogoutConfirm(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
   // throw new Error("Function not implemented.");
 // }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <div className="border-b bg-background">
                {activeSection && (
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setActiveSection(null)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1>
                                {activeSection === 'wishlist' && '관심 목록'}
                                {activeSection === 'purchase' && '구매 내역'}
                                {activeSection === 'reviews' && '받은 후기'}
                            </h1>
                        </div>
                    </div>
                )}
            </div>

            <div className="container mx-auto max-w-4xl">
                {/* 관심 목록 섹션 */}
                {activeSection === 'wishlist' && (
                    <div className="bg-card px-4 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {wishlistItems.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    {...product}
                                    onClick={() => onNavigate('detail', product.id)}
                                />
                            ))}
                        </div>
                        {wishlistItems.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                관심 목록이 비어있습니다
                            </div>
                        )}
                    </div>
                )}

                {/* 구매 내역 섹션 */}
                {activeSection === 'purchase' && (
                    <div className="bg-card">
                        <div className="px-4 py-4">
                            <Select onValueChange={setDateFilter} value={dateFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="기간 선택">
                                        {dateFilter === 'all' && '전체'}
                                        {dateFilter === '1month' && '1개월'}
                                        {dateFilter === '3months' && '3개월'}
                                        {dateFilter === '6months' && '6개월'}
                                        {dateFilter === '1year' && '1년'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    <SelectItem value="1month">1개월</SelectItem>
                                    <SelectItem value="3months">3개월</SelectItem>
                                    <SelectItem value="6months">6개월</SelectItem>
                                    <SelectItem value="1year">1년</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {purchaseHistory.map((item) => (
                            <div key={item.id} className="px-4 py-4 border-b last:border-b-0">
                                <div className="flex gap-3">
                                    <img 
                                        src={item.image} 
                                        alt={item.title}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {item.purchaseDate} 구매완료
                                        </p>
                                        <p className="mb-1">{item.title}</p>
                                        <p className="text-emerald-600">{item.price.toLocaleString()}원</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button variant="outline" size="sm" onClick={() => {
                                            setSelectedPurchase(item);
                                            setShowReviewDialog(true);
                                        }}>
                                            후기 작성
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            다시 구매
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {purchaseHistory.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                구매 내역이 없습니다
                            </div>
                        )}
                    </div>
                )}

                {/* 받은 후기 섹션 */}
                {activeSection === 'reviews' && (
                    <div className="bg-card">
                        {reviews.map((review) => (
                            <div key={review.id} className="px-4 py-4 border-b last:border-b-0">
                                <div className="flex gap-3 mb-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={review.reviewerImage} />
                                        <AvatarFallback>{review.reviewer[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{review.reviewer}</span>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${
                                                            i < review.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{review.date}</p>
                                    </div>
                                </div>
                                <p className="mb-2">{review.comment}</p>
                                <p className="text-sm text-muted-foreground">상품: {review.productTitle}</p>
                            </div>
                        ))}
                        {reviews.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                받은 후기가 없습니다
                            </div>
                        )}
                    </div>
                )}

                {/* 기본 마이페이지 뷰 */}
                {!activeSection && (
                    <>
                        {/* Profile Section (user 객체 사용) */}
                        <div className="bg-card px-4 py-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2>{user.name}</h2>
                                        <Badge variant="secondary" className="text-xs">
                                            ⭐ {user.rating}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {user.location}
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => setShowProfileEdit(true)}>
                                        프로필 수정
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Menu Items */}
                        <div className="bg-card">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label}>
                                        <button className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
                                            onClick={() => setActiveSection(item.id)}>
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                <span>{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.count !== undefined && (
                                                    <Badge variant="secondary">{item.count}</Badge>
                                                )}
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </button>
                                        {index < menuItems.length - 1 && <Separator />}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="h-2 bg-muted"></div>

                        {/* My Products */}
                        <div className="bg-card px-4 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3>판매 중인 상품</h3>
                                <Button variant="link" size="sm">
                                    전체보기
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {myProducts.filter(p => !isProductDeleted(p.id)).map((product) => (
                                    <MyProductCard
                                        key={product.id}
                                        {...product}
                                        // 백엔드 상태를 productStatuses에 저장했다면 사용합니다.
                                        status={productStatuses[product.id] || product.status} 
                                        isHidden={isProductHidden(product.id)}
                                        onClick={() => onNavigate('detail', product.id)}
                                        onEdit={(id) => onNavigate('product-edit', id)}
                                        onStatusChange={handleStatusChange}
                                        onDelete={setProductToDelete}
                                        onToggleVisibility={(id) => {
                                            toggleProductVisibility(id);
                                            setProductStatuses(prev => ({ ...prev }));
                                        }}
                                    />
                                ))}
                            </div>
                            {myProducts.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    등록된 판매 상품이 없습니다
                                </div>
                            )}
                        </div>

                        <div className="h-2 bg-muted"></div>

                        {/* Settings */}
                        <div className="bg-card">
                            {settingItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label}>
                                        <button className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                <span>{item.label}</span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </button>
                                        {index < settingItems.length - 1 && <Separator />}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-4 py-8 text-center">
                            <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setShowLogoutDialog(true)}
                            >
                                로그아웃
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Profile Edit Dialog */}
            <ProfileEditDialog
                open={showProfileEdit}
                onClose={() => setShowProfileEdit(false)}
                //onSave={handleProfileSave}
                profile={userProfile}
            />

            {/* Delete Product Confirmation Dialog */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>상품 삭제 확인</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)}>
                            취소
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => productToDelete && handleDeleteProduct(productToDelete)}>
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Review Dialog */}
            <ReviewDialog
                open={showReviewDialog}
                onClose={() => {
                    setShowReviewDialog(false);
                    setSelectedPurchase(null);
                }}
                productId={selectedPurchase?.id || ''}
                productTitle={selectedPurchase?.title || ''}
                sellerName="판매자"
                sellerImage="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200"
            />

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그아웃</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말 로그아웃하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowLogoutDialog(false)}>
                            취소
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogoutConfirm}>
                            확인
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// **[참고]** 실제 사용 시 `../api/mypage` 파일과 그 안의 `mypageApi` 객체를 구현해야 합니다.