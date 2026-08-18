"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { useLocation } from "@/components/LocationContext";
import Icon from "@/components/Icon";
import { marketplaceChatHref } from "@/lib/marketplace-chat";
import {
  Btn,
  Card,
  Pill,
  Tag,
  Avatar,
  ImgPh,
  SectionHead,
  PageHeader,
  useGlobalToast,
} from "@/components/primitives";
import type { Condition, MarketplaceListing } from "@/data/marketplace";
import {
  PostListingModal,
  InfoModal,
} from "@/components/FormModals";
import styles from "./page.module.css";

interface CityOption {
  id: string;
  name: string;
  countryId: string;
  country: string;
}

const cats = [
  "All",
  "Electronics",
  "Furniture",
  "Books",
  "Vehicles",
  "Kitchen",
  "Clothing",
  "Kids & Toys",
];
const PAGE_SIZE = 12;
const conditionClass: Record<Condition, string> = {
  New: styles.conditionNew,
  "Like new": styles.conditionLikeNew,
  Good: styles.conditionGood,
  Used: styles.conditionUsed,
};
const trustItems = [
  {
    icon: "verify" as const,
    title: "Mandal-verified sellers",
    sub: "Every seller is community-vouched",
    css: styles.trustGreen,
  },
  {
    icon: "people" as const,
    title: "340+ active listings",
    sub: "New items added every day",
    css: styles.trustSaffron,
  },
  {
    icon: "chat" as const,
    title: "Direct contact",
    sub: "No platform fees · DM directly",
    css: styles.trustBlue,
  },
  {
    icon: "globe" as const,
    title: "12 countries",
    sub: "US, UK, Canada, Australia & more",
    css: styles.trustBrick,
  },
];

export default function MarketplacePage() {
  const { location } = useLocation();
  const [activeCat, setActiveCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [savingFavorites, setSavingFavorites] = useState<Set<string>>(
    new Set(),
  );
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [postListingOpen, setPostListingOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState("All cities");
  const [conditionFilter, setConditionFilter] = useState("Any condition");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [sortBy, setSortBy] = useState("Newest");
  const [infoOpen, setInfoOpen] = useState(false);
  const [pagination, setPagination] = useState({ key: "", count: PAGE_SIZE });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const toast = useGlobalToast();
  const router = useRouter();
  const [checkingLimit, setCheckingLimit] = useState(false);

  const currentUserId = useState<number | null>(() => {
    try {
      return (
        Number(JSON.parse(window.localStorage.getItem("mcs_user") || "{}").id) ||
        null
      );
    } catch {
      return null;
    }
  })[0];

  const isOwner = (l: MarketplaceListing) =>
    Boolean(
      currentUserId &&
        l.ownerId &&
        String(l.ownerId) === String(currentUserId),
    );

  useEffect(() => {
    fetch("/api/data/marketplace", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch(console.error);

    let userId = 0;
    try {
      userId =
        Number(JSON.parse(localStorage.getItem("mcs_user") || "{}").id) || 0;
    } catch {}
    if (userId) {
      fetch(`/api/marketplace/favorites?userId=${userId}`)
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) => {
          const favorites = (data.favorites || []) as Array<{
            id: number;
            marketplaceId: number;
          }>;
          setSaved(
            new Set(
              favorites.map((favorite) => String(favorite.marketplaceId)),
            ),
          );
        })
        .catch(() => undefined);
    }
  }, [refreshKey]);

  useEffect(() => {
    if (location.country === "All" || !location.countryId) return;
    const controller = new AbortController();
    fetch(
      `/api/v1/models/C_City?countryId=${encodeURIComponent(location.countryId)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then((response) =>
        response.ok ? response.json() : Promise.reject(),
      )
      .then((data) =>
        setCities(Array.isArray(data.records) ? data.records : []),
      )
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load cities:", error);
          setCities([]);
        }
      });
    return () => controller.abort();
  }, [location.country, location.countryId]);

  const availableListings = useMemo(
    () => listings.filter((l) => !l.sold),
    [listings],
  );

  const cityOptions = useMemo(() => {
    const fromApi =
      location.country === "All" || !location.countryId ? [] : cities;
    if (fromApi.length > 0) return fromApi.map((c) => c.name);
    return Array.from(new Set(availableListings.map((l) => l.city))).sort();
  }, [cities, availableListings, location.country, location.countryId]);

  const activeCityFilter = cityOptions.includes(cityFilter)
    ? cityFilter
    : "All cities";

  const sortedListings = useMemo(() => {
    const filtered = availableListings.filter((l) => {
      const matchCat = activeCat === "All" || l.cat === activeCat;
      const query = searchQuery.toLowerCase();
      const matchQ =
        !query ||
        l.title.toLowerCase().includes(query) ||
        l.seller.toLowerCase().includes(query);
      const matchCity =
        activeCityFilter === "All cities" ||
        l.city.split(",")[0].trim().toLowerCase() ===
          activeCityFilter.toLowerCase();
      const matchCond =
        conditionFilter === "Any condition" || l.condition === conditionFilter;
      return matchCat && matchQ && matchCity && matchCond;
    });
    return [...filtered].sort((a, b) => {
      const priceA = parseInt(a.price.replace(/\D/g, "")) || 0;
      const priceB = parseInt(b.price.replace(/\D/g, "")) || 0;
      if (sortBy === "Newest")
        return (
          (new Date(b.createdAt || 0).getTime() || 0) -
          (new Date(a.createdAt || 0).getTime() || 0)
        );
      if (sortBy === "Price Low to High") return priceA - priceB;
      if (sortBy === "Price High to Low") return priceB - priceA;
      return 0;
    });
  }, [activeCat, activeCityFilter, availableListings, conditionFilter, searchQuery, sortBy]);

  const paginationKey = [
    activeCat,
    activeCityFilter,
    conditionFilter,
    searchQuery,
    sortBy,
  ].join("\u0000");
  const visibleCount =
    pagination.key === paginationKey ? pagination.count : PAGE_SIZE;
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= sortedListings.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPagination((current) => ({
            key: paginationKey,
            count: Math.min(
              (current.key === paginationKey ? current.count : PAGE_SIZE) +
                PAGE_SIZE,
              sortedListings.length,
            ),
          }));
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [paginationKey, sortedListings.length, visibleCount]);

  const toggleSave = async (id: string, name: string) => {
    if (savingFavorites.has(id)) return;

    let userId = 0;
    try {
      userId =
        Number(JSON.parse(localStorage.getItem("mcs_user") || "{}").id) || 0;
    } catch {}
    const marketplaceId = Number(id);
    if (!userId || !marketplaceId) return;

    const active = !saved.has(id);
    setSaved((current) => {
      const next = new Set(current);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
    setSavingFavorites((current) => new Set(current).add(id));

    try {
      const response = await fetch(
        "/api/v1/models/MCS_Marketplace_Favorite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            AD_User_ID: userId,
            MCS_MarketPlaces_ID: marketplaceId,
            Name: name,
            MCS_SavedDate: new Date().toISOString(),
            IsActive: active,
          }),
        },
      );
      if (!response.ok) throw new Error("Could not update favorite");
      await response.json();
    } catch {
      setSaved((current) => {
        const next = new Set(current);
        if (active) next.delete(id);
        else next.add(id);
        return next;
      });
    } finally {
      setSavingFavorites((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const editListing = (l: MarketplaceListing) => {
    window.location.href = `/marketplace/${l.id}?edit=1`;
  };

  const deleteListing = async (l: MarketplaceListing) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      const response = await fetch(
        `/api/v1/models/MCS_MarketPlaces/${l.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Could not delete listing");
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error(error);
    }
  };

  const openPostListing = async () => {
    if (checkingLimit) return;
    setCheckingLimit(true);
    try {
      const response = await fetch("/api/marketplace/daily-limit", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as {
          restricted: boolean;
          count: number;
          limit: number;
        };
        if (data.restricted && data.count >= data.limit) {
          toast.add(
            `You have reached the daily limit of ${data.limit} listings. Please try again tomorrow.`,
            "error",
          );
          return;
        }
      }
      setPostListingOpen(true);
    } catch {
      setPostListingOpen(true);
    } finally {
      setCheckingLimit(false);
    }
  };

  const openChat = (l: MarketplaceListing) => {
    const href = marketplaceChatHref({
      ownerId: l.ownerId ? String(l.ownerId) : "",
      sellerName: l.seller,
      listingId: String(l.id),
      listingTitle: l.title,
      listingPrice: l.price,
      listingLocation: l.city,
    });
    const user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    if (!user || !Number(user?.id) || user?.isGuest) {
      localStorage.setItem("mcs_login_return", href);
      router.push("/login");
      return;
    }
    router.push(href);
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Buy & Sell"
        marathi="बाजार"
        subtitle="Community marketplace · 340+ listings · vetted Mandal members only"
        actions={
          <>
            <Btn
              kind="dark"
              size="md"
              iconL="plus"
              onClick={openPostListing}
              disabled={checkingLimit}
            >
              Post a listing
            </Btn>
          </>
        }
      />

      <div className={`mob-2col ${styles.trustGrid}`}>
        {trustItems.map((item) => (
          <Card key={item.title} pad={16} className={styles.trustCard}>
            <div className={`${styles.trustIcon} ${item.css}`}>
              <Icon name={item.icon} size={20} />
            </div>
            <div>
              <div className={styles.trustTitle}>{item.title}</div>
              <div className={styles.trustSubtitle}>{item.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card pad={14} className={`mob-stack ${styles.filters}`}>
        <div className={styles.searchField}>
          <Icon name="search" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="MacBook, saree, sofa, kadhai…"
            className={styles.searchInput}
          />
        </div>
        <select
          value={activeCityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option>All cities</option>
          {cityOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option>Any condition</option>
          <option>New</option>
          <option>Like new</option>
          <option>Good</option>
          <option>Used</option>
        </select>
        <Btn kind="primary" size="md">
          Search
        </Btn>
      </Card>

      <div className={styles.categories}>
        {cats.map((c) => (
          <Pill
            key={c}
            active={activeCat === c}
            onClick={() => setActiveCat(c)}
          >
            {c}
          </Pill>
        ))}
      </div>

      <section>
        <SectionHead
          title="Latest listings"
          subtitle={`${sortedListings.length} item${sortedListings.length === 1 ? "" : "s"} · ${activeCat}`}
          action={
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="Newest">Sort: Newest</option>
              <option value="Price Low to High">
                Sort: Price (Low to High)
              </option>
              <option value="Price High to Low">
                Sort: Price (High to Low)
              </option>
            </select>
          }
        />
        {loading ? (
          <div className={styles.stateMessage}>Loading listings...</div>
        ) : sortedListings.length === 0 ? (
          <Card pad={32} className={styles.emptyState}>
            <div className={styles.emptyTitle}>
              Nothing in this category yet
            </div>
            <p className={styles.emptyCopy}>Be the first to list something.</p>
            <Btn kind="primary" size="md" iconL="plus" onClick={openPostListing}>
              Post a listing
            </Btn>
          </Card>
        ) : (
          <>
            <div className={`mob-2col ${styles.listingsGrid}`}>
              {sortedListings.slice(0, visibleCount).map((l) => {
                const isSaved = saved.has(l.id);
                return (
                  <Link
                    key={l.id}
                    href={`/marketplace/${l.id}`}
                    className={styles.listingLink}
                  >
                    <Card pad={0} interactive className={styles.listingCard}>
                      {l.featured && (
                        <div className={styles.featured}>FEATURED</div>
                      )}
                      <ImgPh kind={l.kind} tone={l.tone} height={160} src={l.image} />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSave(l.id, l.title);
                        }}
                        disabled={savingFavorites.has(l.id)}
                        aria-label={
                          isSaved ? "Remove from saved" : "Save listing"
                        }
                        className={`${styles.saveButton} ${isSaved ? styles.saved : ""}`}
                      >
                        <Icon name="heart" size={15} />
                      </button>
                      <div className={styles.listingBody}>
                        <h4 className={styles.listingTitle}>{l.title}</h4>
                        <div className={`num ${styles.price}`}>{l.price}</div>
                        <div className={styles.tags}>
                          <span className={conditionClass[l.condition]}>
                            <Tag>{l.condition}</Tag>
                          </span>
                          <span className={styles.categoryTag}>
                            <Tag>{l.cat}</Tag>
                          </span>
                        </div>
                        <div className={styles.location}>
                          <Icon name="pin" size={12} /> {l.city} · {l.when}
                        </div>
                        <div className={styles.sellerRow}>
                          <div className={styles.sellerIdentity}>
                            <Avatar name={l.seller} size={24} />
                            <div>
                              <div className={styles.sellerName}>
                                {l.seller}
                              </div>
                              <div className={styles.mandal}>{l.mandal}</div>
                            </div>
                          </div>
                          {isOwner(l) ? (
                            <div className={styles.cardOwnerActions}>
                              <Btn
                                kind="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  editListing(l);
                                }}
                              >
                                Edit
                              </Btn>
                              <Btn
                                kind="outline"
                                size="sm"
                                style={{
                                  color: C.brick,
                                  borderColor: C.brick,
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void deleteListing(l);
                                }}
                              >
                                Delete
                              </Btn>
                            </div>
                          ) : (
                            <Btn
                              kind="primary"
                              size="sm"
                              iconL="chat"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openChat(l);
                              }}
                            >
                              Chat
                            </Btn>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            {visibleCount < sortedListings.length && (
              <div
                ref={loadMoreRef}
                className={styles.loadMore}
                aria-label="Loading more listings"
              >
                Loading more listings...
              </div>
            )}
          </>
        )}
      </section>

      
      <PostListingModal
        isOpen={postListingOpen}
        onClose={() => setPostListingOpen(false)}
        onPosted={() => setRefreshKey((current) => current + 1)}
      />
      <InfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Selling Tips"
        content={
          <ul className={styles.tipsList}>
            <li>
              <b>Be descriptive:</b> Include condition, age, and reason for
              selling.
            </li>
            <li>
              <b>Price fairly:</b> Check similar listings to find a competitive
              price.
            </li>
            <li>
              <b>Clean up:</b> Wipe down items before handing them over.
            </li>
            <li>
              <b>Stay safe:</b> Meet in public places during daylight hours.
            </li>
          </ul>
        }
      />
    </div>
  );
}
