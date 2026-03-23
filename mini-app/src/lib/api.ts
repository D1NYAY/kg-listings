const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ListingImage {
  id: string;
  fileId: string;
  order: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: string | number;
  currency: string;
  city: string;
  sellerName: string;
  contactTelegram: string | null;
  contactPhone: string | null;
  photoFileId: string | null;
  photoUrl: string | null;
  images?: ListingImage[];
  category: { id: string; name: string; slug: string };
  approvedAt: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export async function fetchListings(params?: {
  page?: number;
  category?: string;
  city?: string;
  search?: string;
}): Promise<{ listings: Listing[]; pagination: { page: number; total: number; totalPages: number } }> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.category) search.set("category", params.category);
  if (params?.city) search.set("city", params.city);
  if (params?.search) search.set("search", params.search);
  const res = await fetch(`${API_URL}/api/listings?${search}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_URL}/api/listings/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function fetchCities(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/cities`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

/** URL первого (или указанного по индексу) фото объявления */
export function getListingImageUrl(listing: Listing, index = 0): string | null {
  if (listing.photoUrl && index === 0) return listing.photoUrl;
  if (listing.id) {
    if (listing.images && listing.images.length > 0) {
      return `${API_URL}/api/image/${listing.id}/${index}`;
    }
    if (listing.photoFileId && index === 0) {
      return `${API_URL}/api/image/${listing.id}`;
    }
  }
  return null;
}

/** Все URL фото объявления */
export function getListingImageUrls(listing: Listing): string[] {
  const urls: string[] = [];
  const count = Math.max(listing.images?.length ?? 0, listing.photoFileId ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const url = getListingImageUrl(listing, i);
    if (url) urls.push(url);
  }
  return urls;
}
