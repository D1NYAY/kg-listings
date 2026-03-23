"use client";

import Link from "next/link";
import type { Listing } from "@/lib/api";
import { getListingImageUrl } from "@/lib/api";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const imgUrl = getListingImageUrl(listing);
  const price = typeof listing.price === "string" ? listing.price : String(listing.price);
  const date = new Date(listing.approvedAt || listing.createdAt).toLocaleDateString("ru-KG", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link href={`/listing/${listing.id}`}>
      <article className="bg-tg-bg-secondary rounded-2xl overflow-hidden active:opacity-90 transition-opacity">
        <div className="aspect-[4/3] bg-tg-bg-tertiary relative">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-tg-hint text-4xl">
              📷
            </div>
          )}
          <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {listing.city}
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-tg-text line-clamp-2">{listing.title}</h3>
          <p className="text-tg-button font-bold mt-1">{price} KGS</p>
          <p className="text-tg-hint text-xs mt-0.5">{date} • {listing.category.name}</p>
        </div>
      </article>
    </Link>
  );
}
