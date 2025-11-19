import { ChevronRight, Settings, Heart, ShoppingBag, Star, Bell, ArrowLeft, UserX, UserMinus } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { MyProductCard } from "../components/MyProductCard";
import { ProfileEditDialog } from "../components/ProfileEditDialog";
import { ReviewDialog } from "../components/ReviewDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

// ⚠️ API/Service Imports & DTO Types (경로 및 타입은 실제 환경에 맞게 조정 필요)
import { myPageApi as api } from "../services/api/mypageApi"; 
import type { 
    MyPageResponse, ServerReviewItem, ProductListItem as ServerProduct,
    TransactionHistoryResponse, TransactionItem, UserListItem, ProductStatus
} from "../services/api/mypageApi"; 

// --- 타입 확장 (⚠️ DTO에 없는 경우 임시로 가정) ---
// ServerReviewItem에 거래(상품) 정보를 추가로 가진다고 가정
interface EnhancedServerReviewItem extends ServerReviewItem {
    productId?: number;
    productTitle?: string;
}
// ------------------------------------------------

// ===============================================
// MyPage Component
// ===============================================

interface MyPageProps {
    onNavigate: (page: string, id?: string) => void;
    onLogout: () => void;
}

export function MyPage({ onNavigate, onLogout }: MyPageProps) {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Core Data States
    const [myPageData, setMyPageData] = useState<MyPageResponse | null>(null);
    // 타입을 확장된 리뷰 타입으로 변경
    const [receivedReviews, setReceivedReviews] = useState<EnhancedServerReviewItem[]>([]); 
    const [mySoldProducts, setMySoldProducts] = useState<ServerProduct[]>([]);
    const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryResponse | null>(null);
    const [blockedUsers, setBlockedUsers] = useState<UserListItem[]>([]);
    const [reportHistory, setReportHistory] = useState<any[]>([]); 
    const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

    // UI/Modal States
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('all'); 

    // 🔄 데이터 로딩 로직 (API 호출)
    const loadMyPageData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                data, reviews, soldProducts, txHistory, blocked, reports, favorites,
            ] = await Promise.all([
                // 🔴 가장 중요한 사용자 정보 로드 (실패 시 에러 처리)
                api.fetchMyPageData().catch((err: any) => { 
                    console.error("기본 데이터 로드 실패:", err.response?.status || err.message, err); 
                    return null; 
                }),
                // 리뷰 데이터의 타입 캐스팅 (EnhancedServerReviewItem으로 가정)
                api.fetchReceivedReviews().catch(() => []) as Promise<EnhancedServerReviewItem[]>,
                api.fetchMySoldProducts().catch(() => []),
                api.fetchTransactionHistory().catch(() => null),
                api.fetchBlockedUsers().catch(() => []),
                api.fetchMyReportHistory().catch(() => []),
                api.fetchFavorites().catch(() => []),
            ]);

            if (!data) {
                setError("사용자 정보를 불러오는 데 실패했습니다. 로그인을 확인하거나 서버 상태를 점검하세요.");
                setMyPageData(null);
                return;
            }

            setMyPageData(data);
            setReceivedReviews(reviews || []);
            setMySoldProducts(soldProducts || []);
            setTransactionHistory(txHistory);
            setBlockedUsers(blocked || []);
            setReportHistory(reports || []);
            setFavoriteIds(favorites || []);

        } catch (err) {
            console.error("마이페이지 데이터 로딩 중 예상치 못한 오류 발생:", err);
            setError("데이터를 불러오는 데 실패했습니다. 서버 상태를 확인하세요.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMyPageData();
    }, [loadMyPageData]);

    // Handler: 프로필 수정 저장 (⚠️ DTO에 맞게 필드명 변환 필요 가능)
    const handleProfileSave = async (profile: { nickname: string; profileImage: string }) => {
        try {
            // DTO 필드명이 다를 경우 변환 예시:
            // const updateData = { userNickname: profile.nickname, profileImageUrl: profile.profileImage };
            await api.updateProfile(profile); 
            setShowProfileEdit(false);
            loadMyPageData(); // 성공 시 새로고침
        } catch (e) {
            alert(`프로필 업데이트 실패: ${e instanceof Error ? e.message : '알 수 없음'}`);
        }
    };
    
    // Handler: 상품 상태 변경
    const handleStatusChange = async (productId: number, status: ProductStatus) => {
        try {
            await api.updateProductStatus(productId, status);
            loadMyPageData(); 
        } catch (e) {
            alert(`상품 상태 업데이트 실패: ${e instanceof Error ? e.message : '알 수 없음'}`);
        }
    };

    // Handler: 상품 삭제
    const handleDeleteProduct = async (productId: number) => {
        try {
            await api.deleteProduct(productId);
            setProductToDelete(null);
            loadMyPageData(); 
        } catch (e) {
            alert(`상품 삭제 실패: ${e instanceof Error ? e.message : '알 수 없음'}`);
        }
    };


    // Derived Data (DTO 필드명 일치 확인)
    const user = useMemo(() => ({
        name: myPageData?.userNickname || '알 수 없음', 
        image: myPageData?.profileImageUrl,
        rating: myPageData?.mannerTemperature || 0.0, 
        reviewCount: receivedReviews.length,
        grade: myPageData?.grade || '미정',
        location: myPageData?.location || '지역 미등록',
    }), [myPageData, receivedReviews]);

    const onSaleCount = mySoldProducts.filter(p => p.status === 'ON_SELL' && !p.isDelete).length;

    const menuItems = [
        { icon: Heart, label: '관심 목록', count: favoriteIds.length, id: 'wishlist' },
        { icon: ShoppingBag, label: '거래 내역', count: transactionHistory?.transactions.length || 0, id: 'transactionHistory' },
        { icon: Star, label: '받은 후기', count: receivedReviews.length, id: 'reviews' },
        { icon: UserX, label: '차단 목록', count: blockedUsers.length, id: 'blockedUsers' },
        { icon: UserMinus, label: '신고 내역', count: reportHistory.length, id: 'reportHistory' },
    ];

    // 거래 내역 필터링 로직 (기존 유지)
    const years = useMemo(() => {
        if (!transactionHistory) return [];
        return Object.keys(transactionHistory.monthlyHistory).sort((a, b) => parseInt(b) - parseInt(a));
    }, [transactionHistory]);

    const filteredTransactions = useMemo(() => {
        if (!transactionHistory) return [];
        if (selectedYear === 'all') return transactionHistory.transactions;
        
        return transactionHistory.transactions.filter(
            item => item.transactionDate.startsWith(selectedYear)
        );
    }, [transactionHistory, selectedYear]);

    // ===============================================
    // Render
    // ===============================================

    if (loading) {
        return <div className="text-center py-20">데이터를 불러오는 중입니다...</div>;
    }

    if (error || !myPageData) {
        const displayMessage = error || "로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.";
        return (
            <div className="text-center py-20 px-4">
                <h1 className="text-2xl text-red-600 font-bold mb-4">🚨 {displayMessage}</h1>
                <Button onClick={loadMyPageData}>재시도</Button>
            </div>
        );
    }

    const EmptyState = ({ message }: { message: string }) => (
        <div className="text-center py-12 text-muted-foreground border border-red-500/30 rounded-lg p-6 bg-red-50/50">
            <p className="text-base font-semibold text-red-600">😅 {message}</p>
        </div>
    );


    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header: Back Button and Title */}
            <div className="border-b bg-background sticky top-0 z-10">
                {activeSection && (
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setActiveSection(null)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-semibold">
                                {menuItems.find(item => item.id === activeSection)?.label || ''}
                                {activeSection === 'myProducts' && '내 상품 관리'}
                            </h1>
                        </div>
                    </div>
                )}
            </div>

            <div className="container mx-auto max-w-4xl">
                
                {/* 1. 관심 목록 섹션 (Wishlist) */}
                {activeSection === 'wishlist' && (
                    <div className="bg-card px-4 py-6">
                        {favoriteIds.length > 0 ? (
                            <div className="col-span-2 md:col-span-3 text-center py-12">
                                <p className="text-muted-foreground">총 **{favoriteIds.length}개**의 관심 상품을 로드합니다. (실제 목록 렌더링 로직 필요)</p>
                            </div>
                        ) : (
                            <EmptyState message="관심 상품 목록이 비어 있습니다. 찜 버튼을 눌러보세요!" />
                        )}
                    </div>
                )}

                {/* 2. 거래 내역 섹션 (Transaction History) */}
                {activeSection === 'transactionHistory' && (
                    <div className="bg-card">
                        {/* 필터 UI */}
                        <div className="px-4 py-4 border-b">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm font-medium">거래 통계</p>
                                {transactionHistory && (
                                    <Card className="p-2 border-primary">
                                        <CardTitle className="text-lg text-primary">{transactionHistory.totalTransactions} 건</CardTitle>
                                        <CardDescription className="text-xs">총 거래</CardDescription>
                                    </Card>
                                )}
                            </div>
                            <Select onValueChange={setSelectedYear} value={selectedYear}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="기간 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    {years.map(year => (
                                        <SelectItem key={year} value={year}>{year}년</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {filteredTransactions.length ? (
                            filteredTransactions.map((item) => (
                                <div key={item.transactionId} className="px-4 py-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                                    <div className="flex gap-3">
                                        <img
                                            src={`https://picsum.photos/id/${item.transactionId % 100}/200/200`}
                                            alt={item.title}
                                            className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                                            onClick={() => onNavigate('detail', item.transactionId.toString())}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground mb-1">
                                                {item.transactionDate.substring(0, 10)} | {item.isBuyer ? '구매' : '판매'} | <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'} className="inline-flex">{item.status}</Badge>
                                            </p>
                                            <p className="mb-1 font-medium truncate">{item.title}</p>
                                            <p className="text-emerald-600 font-semibold">{item.price.toLocaleString()}원</p>
                                            <p className="text-sm text-muted-foreground">상대: {item.partnerNick}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center">
                                            {item.isBuyer && item.status === 'COMPLETED' && (
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setSelectedTransaction(item);
                                                    setShowReviewDialog(true);
                                                }}>
                                                    후기 작성
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState message="필터링된 거래 내역이 없습니다." />
                        )}
                    </div>
                )}

                {/* 3. 받은 후기 섹션 (Received Reviews) */}
                {activeSection === 'reviews' && (
                    <div className="bg-card">
                        {receivedReviews.length > 0 ? (
                            receivedReviews.map((review) => (
                                <div key={review.reviewId} className="px-4 py-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                                    <div className="flex gap-3 mb-3">
                                        <Avatar className="h-10 w-10"><AvatarFallback>{review.reviewerNick[0]}</AvatarFallback></Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{review.reviewerNick}</span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-4 w-4 ${i < (review.ratingScore || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300' }`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{review.createdAt.substring(0, 10)}</p>
                                        </div>
                                    </div>
                                    <p className="mb-2 text-base">{review.content}</p>
                                    {/* 💡상품 연동 보강 (DTO가 확정되면 해당 필드를 사용) */}
                                    <p className="text-sm text-muted-foreground">
                                        상품: {review.productTitle || `거래 ID: ${review.productId || '미상'}`}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <EmptyState message="아직 받은 후기가 없습니다. 좋은 거래를 해보세요!" />
                        )}
                    </div>
                )}
                
                {/* 4. 차단 사용자 섹션 (Blocked Users) */}
                {activeSection === 'blockedUsers' && (
                    <div className="bg-card">
                        {blockedUsers.length > 0 ? (
                            <div className="text-center py-12 text-muted-foreground">차단 사용자 목록을 렌더링합니다. (총 **{blockedUsers.length}명**)</div>
                        ) : (
                            <EmptyState message="차단한 사용자가 없습니다." />
                        )}
                    </div>
                )}

                {/* 5. 신고 내역 섹션 (My Report History) */}
                {activeSection === 'reportHistory' && (
                    <div className="bg-card">
                        {reportHistory.length > 0 ? (
                            <div className="text-center py-12 text-muted-foreground">내가 신고한 내역을 렌더링합니다. (총 **{reportHistory.length}건**)</div>
                        ) : (
                            <EmptyState message="내가 신고한 내역이 없습니다." />
                        )}
                    </div>
                )}

                {/* 5-1. 내 상품 관리 전체 섹션 (myProducts) */}
                {activeSection === 'myProducts' && (
                    <div className="bg-card px-4 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {mySoldProducts.filter(p => !p.isDelete).length > 0 ? (
                                mySoldProducts
                                    .filter(p => !p.isDelete)
                                    .map((product) => (
                                        <MyProductCard
                                            key={product.id}
                                            id={product.id.toString()}
                                            title={product.title}
                                            price={product.price}
                                            status={product.status}
                                            createdAt={product.createdAt}
                                            location={product.locationNm}
                                            image={product.mainImage || `https://picsum.photos/id/${product.id % 100}/200/200`} 
                                            onClick={() => onNavigate('detail', product.id.toString())}
                                            onDelete={(id) => setProductToDelete(parseInt(id))}
                                            onStatusChange={(id, status) => handleStatusChange(parseInt(id), status as ProductStatus)}
                                            onToggleVisibility={() => console.log('노출 토글')}
                                            timeAgo={''} likes={0} chatCount={0} isHidden={false} onEdit={() => onNavigate('editProduct', product.id.toString())} // 편집 기능 추가
                                        />
                                    ))
                            ) : (
                                <div className="col-span-2 md:col-span-3">
                                    <EmptyState message="등록된 상품이 없습니다. 지금 판매해보세요!" />
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* 6. 기본 마이페이지 뷰 (Default MyPage) */}
                {!activeSection && (
                    <>
                        {/* 6-1. Profile Section */}
                        <div className="bg-card px-4 py-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20"><AvatarImage src={user.image} alt={user.name} /><AvatarFallback>{user.name[0]}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1"><h2 className="text-2xl font-bold">{user.name}</h2><Badge variant="secondary" className="text-xs">{user.grade}</Badge></div>
                                    <div className="flex items-center gap-2 mb-2"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span className="text-sm font-semibold">{user.rating.toFixed(1)}</span><span className="text-sm text-muted-foreground">({user.reviewCount} 리뷰)</span></div>
                                    <p className="text-sm text-muted-foreground mb-2">{user.location} | 판매 {myPageData?.soldCount || 0}건</p>
                                    <Button variant="outline" size="sm" onClick={() => setShowProfileEdit(true)}>프로필 수정</Button>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* 6-2. Menu Items */}
                        <div className="bg-card">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label}>
                                        <button
                                            className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
                                            onClick={() => setActiveSection(item.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                <span className="font-medium">{item.label}</span>
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

                        {/* 6-3. My Products (내가 판매 중인 상품) */}
                        <div className="bg-card px-4 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3>판매 중인 상품 ({onSaleCount})</h3>
                                <Button variant="link" size="sm" onClick={() => setActiveSection('myProducts')}>
                                    전체보기
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {onSaleCount > 0 ? (
                                    mySoldProducts
                                        .filter(p => p.status === 'ON_SELL' && !p.isDelete)
                                        .slice(0, 3)
                                        .map((product) => (
                                            <MyProductCard
                                                key={product.id}
                                                id={product.id.toString()}
                                                title={product.title}
                                                price={product.price}
                                                status={product.status}
                                                createdAt={product.createdAt}
                                                location={product.locationNm}
                                                image={product.mainImage || `https://picsum.photos/id/${product.id % 100}/200/200`}
                                                onClick={() => onNavigate('detail', product.id.toString())}
                                                onDelete={(id) => setProductToDelete(parseInt(id))}
                                                onStatusChange={(id, status) => handleStatusChange(parseInt(id), status as ProductStatus)}
                                                onToggleVisibility={() => console.log('노출 토글')}
                                                timeAgo={''} likes={0} chatCount={0} isHidden={false} onEdit={() => onNavigate('editProduct', product.id.toString())}
                                            />
                                        ))
                                ) : (
                                    <div className="col-span-2 md:col-span-3">
                                        <EmptyState message="판매 중인 상품이 없습니다." />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-2 bg-muted"></div>

                        {/* 6-4. Settings and Support */}
                        <div className="bg-card">
                            <button
                                className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
                                onClick={() => onNavigate('notifications')}
                            >
                                <div className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">알림 설정</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <Separator />
                            <button
                                className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
                                onClick={() => onNavigate('settings')}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">앱 설정</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Logout Button */}
                        <div className="px-4 py-8 text-center">
                            <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={onLogout}>
                                로그아웃
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* 7. Modals and Dialogs */}
            <ProfileEditDialog
                open={showProfileEdit}
                onClose={() => setShowProfileEdit(false)}
                // DTO 필드명에 맞게 prop 이름 변경 (nickname, profileImage)
                onSave={({ nickname, profileImage }) => handleProfileSave({ nickname: nickname, profileImage: profileImage })}
                profile={{ nickname: myPageData?.userNickname || '', profileImage: myPageData?.profileImageUrl || '' }} 
            />

            {/* 상품 삭제 AlertDialog */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>상품 삭제 확인</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다. (**논리적 삭제**를 요청합니다.)
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

            <ReviewDialog
                open={showReviewDialog}
                onClose={() => {
                    setShowReviewDialog(false);
                    setSelectedTransaction(null);
                }}
                productId={selectedTransaction?.transactionId?.toString() || ''}
                productTitle={selectedTransaction?.title || ''}
                sellerName={selectedTransaction?.partnerNick || '상대방'}
                sellerImage="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200"
            />
        </div>
    );
}