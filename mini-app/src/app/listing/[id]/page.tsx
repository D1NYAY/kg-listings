"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchListing, getListingImageUrls, type Listing } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { useTelegram } from "@/hooks/useTelegram";

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const tg = useTelegram();

  useEffect(() => {
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(() => router.back());
    return () => tg.BackButton.hide();
  }, [tg, router]);

  useEffect(() => {
    fetchListing(id).then((l) => {
      setListing(l ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-tg-hint">Загрузка...</span>
      </div>
    );
  }

  const imageUrls = getListingImageUrls(listing);
  const mainImgUrl = imageUrls[currentImageIndex] ?? imageUrls[0];
  const contactUrl = listing.contactTelegram
    ? `https://t.me/${listing.contactTelegram.replace("@", "")}`
    : listing.contactPhone
    ? `tel:${listing.contactPhone}`
    : null;

  return (
    <div className="min-h-screen pb-20">
      <div className="aspect-[4/3] bg-tg-bg-tertiary relative">
        {mainImgUrl ? (
          <img
            src={mainImgUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            📷
          </div>
        )}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === currentImageIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Фото ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-tg-button font-bold text-lg">
          {typeof listing.price === "string" ? listing.price : String(listing.price)} KGS
        </p>
        <h1 className="text-xl font-bold mt-1">{listing.title}</h1>
        <p className="text-tg-hint text-sm mt-1">
          {listing.city} • {listing.category.name}
        </p>
        <p className="text-tg-text-secondary mt-4 whitespace-pre-wrap">
          {listing.description}
        </p>
        <p className="text-tg-hint text-sm mt-4">Продавец: {listing.sellerName}</p>
        {contactUrl && (
          <a
            href={contactUrl}
            target={listing.contactTelegram ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="mt-4 block w-full bg-tg-button text-center text-white font-semibold py-3 rounded-xl active:opacity-90"
            onClick={(e) => {
              if (listing.contactTelegram && tg) {
                e.preventDefault();
                tg.openTelegramLink(contactUrl);
              }
            }}
          >
            {listing.contactTelegram ? "Написать в Telegram" : "Позвонить"}
          </a>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
