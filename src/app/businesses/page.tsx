"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { C } from "@/lib/tokens";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useLocation } from "@/components/LocationContext";
import {
  Btn,
  Card,
  Pill,
  Tag,
  Avatar,
  SectionHead,
  PageHeader,
  Rating,
  useGlobalToast,
} from "@/components/primitives";
import { FilterModal } from "@/components/FormModals";
import { Business } from "@/data/businesses";
import { toneBg, toneColor } from "@/lib/tones";
import { ListBusinessModal } from "@/components/FormModals";
import ListingTypeModal from "@/components/ListingTypeModal";
import styles from "./page.module.css";

type BusinessCategoryRecord = {
  id: string | number;
  Name?: string;
  IsActive?: boolean;
};

type CityOption = {
  id: string;
  name: string;
  country?: string;
  countryId?: string;
};

export default function BusinessesPage() {
  const [businessesData, setBusinessesData] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const toast = useGlobalToast();
  const [listBizOpen, setListBizOpen] = useState(false);
  const [listingTypeOpen, setListingTypeOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const { location } = useLocation();
  const [cities, setCities] = useState<CityOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityDropdownOpen) return;
    const controller = new AbortController();
    setCitiesLoading(true);
    const countryQuery =
      location.country !== "All" && location.countryId
        ? `?countryId=${encodeURIComponent(location.countryId)}`
        : "";
    fetch(`/api/v1/models/C_City${countryQuery}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load cities")),
      )
      .then((data) => {
        setCities(Array.isArray(data.records) ? data.records : []);
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          console.error("Cities API error:", error);
      })
      .finally(() => setCitiesLoading(false));
    return () => controller.abort();
  }, [cityDropdownOpen, location.country, location.countryId]);

  useEffect(() => {
    if (!cityDropdownOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [cityDropdownOpen]);

  const filteredCities = useMemo(() => {
    const needle = citySearch.trim().toLowerCase();
    return cities.filter(
      (city) =>
        !needle ||
        `${city.name} ${city.country || ""}`.toLowerCase().includes(needle),
    );
  }, [cities, citySearch]);

  const selectCity = (city: CityOption | null) => {
    setSelectedCity(city?.name || "All");
    setCityDropdownOpen(false);
    setCitySearch("");
  };

  useEffect(() => {
    fetch("/api/data/businesses")
      .then((res) => res.json())
      .then((data) => {
        setBusinessesData(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [reloadKey]);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const user = JSON.parse(localStorage.getItem("mcs_user") || "{}");
        setCurrentUserId(String(user.id || ""));
      } catch {
        setCurrentUserId("");
      }
    });
  }, []);

  useEffect(() => {
    fetch("/api/v1/models/MCS_Business_Category", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load business categories");
        return response.json();
      })
      .then((data: { records?: BusinessCategoryRecord[] }) => {
        const names = (Array.isArray(data.records) ? data.records : [])
          .filter(
            (category) =>
              category.IsActive !== false && Boolean(category.Name?.trim()),
          )
          .map((category) => category.Name!.trim());
        setCategories([...new Set(names)]);
      })
      .catch((error) => {
        console.error("Business category loading failed:", error);
        setCategories([]);
      });
  }, []);

  const cats = ["All", ...categories];

  const [activeCat, setActiveCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Rating");
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setContacted((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const filtered = businessesData.filter((b) => {
    const matchCat = activeCat === "All" || b.cat === activeCat;
    const matchCity =
      selectedCity === "All" ||
      b.city.toLowerCase().includes(selectedCity.toLowerCase());
    const matchQ =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.services.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchCat && matchCity && matchQ;
  });

  const sortedBusinesses = [...filtered].sort((a, b) => {
    if (sortBy === "Rating") {
      return b.rating - a.rating;
    }
    if (sortBy === "Reviews") {
      return b.reviews - a.reviews;
    }
    return 0; // default
  });

  const totalReviews = businessesData.reduce(
    (total, business) => total + business.reviews,
    0,
  );
  const averageRating = businessesData.length
    ? businessesData.reduce((total, business) => total + business.rating, 0) /
      businessesData.length
    : 0;
  const countryCount = new Set(
    businessesData
      .map((business) => business.countryId || business.country)
      .filter(Boolean),
  ).size;
  const businessStats = [
    {
      v: loading ? "..." : String(businessesData.length),
      l: "Registered businesses",
      s: `across ${categories.length} categories`,
    },
    {
      v: loading ? "..." : String(countryCount),
      l: "Countries",
      s: "global Marathi businesses",
    },
  ];

  async function deleteBusiness(event: React.MouseEvent, business: Business) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete "${business.name}"? This cannot be undone.`))
      return;

    try {
      const response = await fetch(
        `/api/v1/models/MCS_Businesses/${encodeURIComponent(business.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Could not delete business");

      toast.add("Business deleted successfully.", "success");
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not delete business",
        "error",
      );
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Business Services"
        marathi="व्यवसाय"
        subtitle={`${loading ? "..." : businessesData.length} Marathi-owned businesses across the globe`}
        actions={
          <>
            <Btn
              kind="dark"
              size="md"
              iconL="plus"
              onClick={() => setListingTypeOpen(true)}
            >
              List business or service
            </Btn>
          </>
        }
      />

      {/* Stats */}
      <div className={`mob-2col ${styles.stats}`}>
        {businessStats.map((s, i) => (
          <Card key={i} pad={20}>
            <div className={`num ${styles.statValue}`}>{s.v}</div>
            <div className={styles.statLabel}>{s.l}</div>
            <div className={styles.statSubtext}>{s.s}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card pad={14} className={`mob-stack ${styles.searchCard}`}>
        <div className={styles.searchField}>
          <Icon name="search" size={16} color={C.ink3} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Businesses"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.citySelectWrap} ref={cityDropdownRef}>
          <button
            type="button"
            className={styles.citySelect}
            onClick={() => {
              setCitiesLoading(true);
              setCityDropdownOpen((open) => !open);
            }}
          >
            <Icon name="pin" size={14} color={C.ink3} />
            <span>{selectedCity}</span>
            <Icon name="chev" size={14} color={C.ink3} />
          </button>
          {cityDropdownOpen && (
            <div className={styles.cityDropdown} role="listbox">
              <label className={styles.citySearchBox}>
                <Icon name="search" size={16} color={C.ink3} />
                <input
                  autoFocus
                  value={citySearch}
                  onChange={(event) => setCitySearch(event.target.value)}
                  placeholder="Search cities..."
                  aria-label="Search cities"
                />
              </label>
              <div className={styles.cityOptions}>
                <button
                  type="button"
                  className={selectedCity === "All" ? styles.cityActive : ""}
                  onClick={() => selectCity(null)}
                >
                  <span>All cities</span>
                  <small>
                    {location.country === "All"
                      ? "Every country"
                      : location.country}
                  </small>
                </button>
                {citiesLoading && (
                  <div className={styles.cityStatus}>Loading cities…</div>
                )}
                {!citiesLoading &&
                  filteredCities.map((city) => (
                    <button
                      type="button"
                      key={`${city.countryId || "all"}-${city.id}`}
                      className={
                        selectedCity === city.name ? styles.cityActive : ""
                      }
                      onClick={() => selectCity(city)}
                    >
                      <span>{city.name}</span>
                      {location.country === "All" && city.country && (
                        <small>{city.country}</small>
                      )}
                    </button>
                  ))}
                {!citiesLoading && !filteredCities.length && (
                  <div className={styles.cityStatus}>No cities found</div>
                )}
              </div>
            </div>
          )}
        </div>
        <Btn kind="primary" size="md">
          Search
        </Btn>
      </Card>

      {/* Category pills */}
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

      {/* Businesses grid */}
      <section>
        <SectionHead
          title="Directory"
          subtitle={`${sortedBusinesses.length} business${sortedBusinesses.length === 1 ? "" : "es"} · ${activeCat}`}
          action={
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="Rating">Sort: Rating</option>
              <option value="Reviews">Sort: Reviews</option>
            </select>
          }
        />
        {loading ? (
          <div className={styles.status}>
            Loading businesses from iDempiere...
          </div>
        ) : filtered.length === 0 ? (
          <Card pad={32} className={styles.emptyState}>
            <div className={styles.emptyTitle}>
              No businesses in this category yet
            </div>
            <p className={styles.emptyText}>Be the first to list yours.</p>
            <Btn
              kind="primary"
              size="md"
              iconL="plus"
              onClick={() => setListingTypeOpen(true)}
            >
              List business or service
            </Btn>
          </Card>
        ) : (
          <div className={`mob-stack ${styles.businessGrid}`}>
            {sortedBusinesses.map((b) => {
              const isContacted = contacted.has(b.id);
              return (
                <Link
                  key={b.id}
                  href={`/businesses/${b.id}`}
                  className={styles.businessLink}
                >
                  <Card interactive className={styles.businessCard}>
                    {/* Header */}
                    <div className={styles.businessHeader}>
                      <div
                        className={styles.businessInitial}
                        data-tone={b.tone}
                      >
                        {b.name[0]}
                      </div>
                      <div className={styles.businessDetails}>
                        <div className={styles.businessNameRow}>
                          <span className={styles.businessName}>{b.name}</span>
                          {b.verified && (
                            <Icon name="verify" size={16} color={C.green} />
                          )}
                        </div>
                        <div className={styles.owner}>{b.owner}</div>
                        <div className={styles.ratingRow}>
                          {b.phone && (
                            <span className={styles.businessMeta}>
                              {b.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className={styles.tags}>
                      <Tag color={toneColor[b.tone]} bg={toneBg[b.tone]}>
                        {b.cat}
                      </Tag>
                      <Tag color={C.ink2} bg={C.bgDeep}>
                        <Icon name="pin" size={11} color={C.ink3} /> {b.city},{" "}
                        {b.country}
                      </Tag>
                      {b.mandal && b.mandal !== "-" && (
                        <Tag color={C.ink2} bg={C.bgDeep}>
                          <Icon name="star" size={11} color={C.ink3} />{" "}
                          {b.mandal}
                        </Tag>
                      )}
                    </div>

                    {/* Description */}
                    <p className={styles.description}>{b.desc}</p>

                    {/* Services */}
                    <div className={styles.services}>
                      {b.services.map((s) => (
                        <Tag key={s} color={C.ink2} bg={C.bgDeep}>
                          {s}
                        </Tag>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className={styles.businessFooter}>
                      <div className={styles.mandal}>{b.mandal}</div>
                      <div className={styles.actions}>
                        {currentUserId && b.ownerId === currentUserId && (
                          <>
                            <Btn
                              kind="outline"
                              size="sm"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setEditingBusiness(b);
                                setListBizOpen(true);
                              }}
                            >
                              Edit
                            </Btn>
                            <Btn
                              kind="ghost"
                              size="sm"
                              onClick={(event) => deleteBusiness(event, b)}
                            >
                              Delete
                            </Btn>
                          </>
                        )}
                        {/* <Btn
                          kind="primary"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `mailto:contact@${b.name.replace(/\s+/g, "").toLowerCase()}.com?subject=Inquiry from Connect2MCS`;
                          }}
                        >
                          Contact
                        </Btn> */}
                        <Btn
                          kind="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(
                              window.location.origin + `/businesses/${b.id}`,
                            );
                            toast.add("Link copied to clipboard!", "success");
                          }}
                        >
                          <Icon name="share" size={14} />
                        </Btn>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <ListingTypeModal
        isOpen={listingTypeOpen}
        onClose={() => setListingTypeOpen(false)}
        onBusiness={() => {
          setEditingBusiness(null);
          setListBizOpen(true);
        }}
        onCreated={() => setReloadKey((key) => key + 1)}
      />
      <ListBusinessModal
        isOpen={listBizOpen}
        business={editingBusiness}
        onClose={() => {
          setListBizOpen(false);
          setEditingBusiness(null);
        }}
        onSaved={() => setReloadKey((key) => key + 1)}
      />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
