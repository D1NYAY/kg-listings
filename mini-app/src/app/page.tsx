"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchListings, fetchCategories, fetchCities, type Listing, type Category } from "@/lib/api";
import { ListingCard } from "@/components/ListingCard";
import { BottomNav } from "@/components/BottomNav";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const activeCity = searchParams.get("city") ?? "";
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchListings({
        category: activeCategory || undefined,
        city: activeCity || undefined,
      }),
      fetchCategories(),
      fetchCities(),
    ]).then(([data, cats, citiesList]) => {
      setListings(data.listings);
      setCategories(cats);
      setCities(citiesList);
      setLoading(false);
    });
  }, [activeCategory, activeCity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchListings({
      category: activeCategory || undefined,
      city: activeCity || undefined,
      search: search || undefined,
    })
      .then((data) => {
        setListings(data.listings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCategoryClick = (catId: string) => {
    const newCat = activeCategory === catId ? "" : catId;
    const params = new URLSearchParams();
    if (newCat) params.set("category", newCat);
    if (activeCity) params.set("city", activeCity);
    router.replace(params.toString() ? `/?${params}` : "/", { scroll: false });
  };

  const handleCityClick = (city: string) => {
    const newCity = activeCity === city ? "" : city;
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (newCity) params.set("city", newCity);
    router.replace(params.toString() ? `/?${params}` : "/", { scroll: false });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-tg-bg border-b border-tg-bg-tertiary px-4 py-3">
        <h1 className="text-xl font-bold">KG Listings</h1>
        <form onSubmit={handleSearch} className="mt-2">
          <input
            type="search"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-tg-bg-secondary rounded-xl px-4 py-2.5 text-tg-text placeholder-tg-hint focus:outline-none focus:ring-2 focus:ring-tg-button"
          />
        </form>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1">
          <button
            onClick={() => handleCategoryClick("")}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              !activeCategory ? "bg-tg-button text-white" : "bg-tg-bg-secondary text-tg-hint"
            }`}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategoryClick(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                activeCategory === c.id ? "bg-tg-button text-white" : "bg-tg-bg-secondary text-tg-hint"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {cities.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1">
            <button
              onClick={() => handleCityClick("")}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                !activeCity ? "bg-tg-bg-tertiary text-tg-text" : "bg-tg-bg-secondary text-tg-hint"
              }`}
            >
              Все города
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  activeCity === city ? "bg-tg-bg-tertiary text-tg-text" : "bg-tg-bg-secondary text-tg-hint"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-tg-hint">Загрузка...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-tg-hint">
            Объявлений пока нет
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-tg-hint">Загрузка...</span></div>}>
      <HomeContent />
    </Suspense>
  );
}
