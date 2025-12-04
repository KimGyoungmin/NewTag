import { productApi } from './productApi';
import { favoriteApi } from './favoriteApi';
import { chatRoomsApi } from './firebase';
import { resolveImageUrl } from '../utils/image';
import { formatTimeAgo } from '../utils/time';
import type { WishlistItem } from '../pages/MyPage';
import { api } from './client';

const toUiStatus = (status?: string | null): 'available' | 'reserved' | 'sold' => {
  switch (status) {
    case 'RESERVED':
      return 'reserved';
    case 'SOLD_OUT':
      return 'sold';
    default:
      return 'available';
  }
};

export const myPageApi = {
  fetchWishlist: async (userId: number): Promise<WishlistItem[]> => {
    const productIds = await favoriteApi.getMyFavoriteProducts(userId);
    if (productIds.length === 0) {
      return [];
    }

    const products = await Promise.all(
      productIds.map((id) => productApi.getById(id, userId))
    );
    const validProducts = products.filter(Boolean);

    if (validProducts.length === 0) {
      return [];
    }

    const chatCounts = await chatRoomsApi.getChatRoomCountsByProducts(
      validProducts.map((p) => p!.id)
    );

    const items = validProducts.map((detail) => {
      if (!detail) return null;
      return {
        id: detail.id.toString(),
        image: resolveImageUrl(detail.thumbnailImage ?? detail.mainImage),
        title: detail.title,
        price: detail.price,
        location: detail.locationNm,
        timeAgo: formatTimeAgo(detail.createdAt),
        likes: detail.favoriteCount ?? 0,
        chatCount: chatCounts.get(detail.id) ?? 0,
        status: toUiStatus(detail.status),
        sellerNick: detail.seller?.nick,
      } as WishlistItem;
    });

    return items.filter(Boolean) as WishlistItem[];
  },

  fetchMyProducts: async (userId: number): Promise<WishlistItem[]> => {
    const response = await api.get(`/products/seller/${userId}`, {
      params: { page: 0, size: 50 },
    });
    const listItems: any[] = response.data?.products ?? [];

    if (listItems.length === 0) {
      return [];
    }

    const productIds = listItems.map((item) => item.id);
    const chatCounts = await chatRoomsApi.getChatRoomCountsByProducts(productIds);

    const products = await Promise.all(
      listItems.map(async (item) => {
        const image = item.thumbnailImage ?? item.mainImage;
        let favoriteCount = item.favoriteCount ?? (item as any).favorite_count;

        if (favoriteCount === undefined) {
          try {
            const detail = await productApi.getById(Number(item.id));
            favoriteCount = detail?.favoriteCount ?? 0;
          } catch (error) {
            console.error("Failed to fetch favorite count for product", item.id, error);
            favoriteCount = 0;
          }
        }

        return {
          id: String(item.id),
          image: resolveImageUrl(image),
          title: item.title ?? "상품",
          price: Number(item.price ?? 0),
          location: item.locationNm ?? "",
          timeAgo: item.timeAgo ?? formatTimeAgo(item.createdAt),
          likes: Number(favoriteCount ?? 0),
          chatCount: chatCounts.get(item.id) ?? 0,
          status: toUiStatus(item.status),
          sellerNick: item.seller?.nick,
        } as WishlistItem;
      })
    );

    return products.filter((p) => p && p.id).filter((p) => p.status !== 'sold');
  },
};
