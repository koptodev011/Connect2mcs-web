"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import {
  Btn,
  Card,
  Pill,
  Tag,
  SectionHead,
  PageHeader,
  Rating,
  useGlobalToast,
} from "@/components/primitives";
import { TiffinProvider } from "@/data/tiffin";
import { InfoModal, TiffinSubscribeModal } from "@/components/FormModals";
import BecomeTiffinProviderModal from "./BecomeTiffinProviderModal";
import { useLocation } from "@/components/LocationContext";
import styles from "./tiffin.module.css";

type CityOption = {
  id: string;
  name: string;
  country?: string;
  countryId?: string;
};
const fallbackFilters = [
  "All",
  "Near me",
  "Vegetarian",
  "Non-veg",
  "Jain",
  "Weekly plan",
  "Trial box",
];
const PAGE_SIZE = 6;

const normalizeCategory = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function TiffinPage() {
  const [tiffinData, setTiffinData] = useState<TiffinProvider[]>([]);
  const [filters, setFilters] = useState(fallbackFilters);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<TiffinProvider | null>(
    null,
  );
  const [deletingProviderId, setDeletingProviderId] = useState("");
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All");
  const [infoOpen, setInfoOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Nearest");
  const [subTarget, setSubTarget] = useState<{
    name: string;
    price: string;
  } | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);
  const { location } = useLocation();
  const toast = useGlobalToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/v1/models/MCS_TiffinProvider?top=100&skip=0")
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load tiffin providers")),
      )
      .then((data) => {
        setTiffinData(Array.isArray(data.records) ? data.records : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/v1/models/MCS_Tiffin_Category")
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Failed to load tiffin categories")),
      )
      .then((payload: unknown) => {
        const records = Array.isArray(payload)
          ? payload
          : payload && typeof payload === "object" && "records" in payload
            ? (payload as { records?: unknown[] }).records || []
            : [];
        const categoryNames = records
          .filter(
            (record): record is Record<string, unknown> =>
              !!record &&
              typeof record === "object" &&
              record.IsActive !== false,
          )
          .map((record) => String(record.Name || record.Value || "").trim())
          .filter(Boolean);

        if (categoryNames.length) {
          setFilters(["All", ...Array.from(new Set(categoryNames))]);
        }
      })
      .catch(console.error);
  }, []);
  useEffect(() => {
    if (!cityModalOpen) return;
    const controller = new AbortController();
    const countryQuery =
      location.country !== "All" && location.countryId
        ? `?countryId=${encodeURIComponent(location.countryId)}`
        : "";
    fetch(`/api/v1/models/C_City${countryQuery}`, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load cities")),
      )
      .then((data) =>
        setCities(Array.isArray(data.records) ? data.records : []),
      )
      .catch((error) => {
        if (error.name !== "AbortError")
          console.error("Cities API error:", error);
      })
      .finally(() => setCitiesLoading(false));
    return () => controller.abort();
  }, [cityModalOpen, location.country, location.countryId]);
  const filtered = useMemo(
    () =>
      tiffinData
        .filter((provider) => {
          const needle = query.trim().toLowerCase();
          return (
            !needle ||
            [
              provider.name,
              provider.city,
              provider.specialty,
              provider.delivery,
              provider.mandal,
              ...provider.menu,
            ].some((value) => String(value).toLowerCase().includes(needle))
          );
        })
        .filter((provider) => {
          if (activeFilter === "All" || activeFilter === "Weekly plan") {
            return true;
          }
          if (activeFilter === "Near me") {
            return (
              provider.city.includes("Boston") ||
              provider.city.includes("Edison")
            );
          }
          if (activeFilter === "Vegetarian") return provider.veg;
          if (activeFilter === "Non-veg") return !provider.veg;
          if (activeFilter === "Jain") return provider.id === "priya";
          if (activeFilter === "Trial box") return provider.trial;

          const categoryText = normalizeCategory(
            [
              provider.specialty,
              ...provider.menu,
              provider.veg ? "Vegetarian Veg" : "Non-veg Non Vegetarian",
              provider.trial ? "Trial box" : "",
            ].join(" "),
          );
          return categoryText.includes(normalizeCategory(activeFilter));
        })
        .filter(
          (provider) =>
            selectedCity === "All" ||
            provider.city.toLowerCase().includes(selectedCity.toLowerCase()),
        ),
    [activeFilter, query, selectedCity, tiffinData],
  );
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
    setVisibleCount(PAGE_SIZE);
    setCityModalOpen(false);
    setCitySearch("");
  };
  const sortedProviders = [...filtered].sort((a, b) =>
    sortBy === "Rating"
      ? b.rating - a.rating
      : sortBy === "Orders"
        ? b.orders - a.orders
        : 0,
  );
  const visibleProviders = sortedProviders.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProviders.length;

  const selectFilter = (filter: string) => {
    setActiveFilter(filter);
    setVisibleCount(PAGE_SIZE);
  };
  const selectSort = (sort: string) => {
    setSortBy(sort);
    setVisibleCount(PAGE_SIZE);
  };
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting)
          setVisibleCount((n) =>
            Math.min(n + PAGE_SIZE, sortedProviders.length),
          );
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, sortedProviders.length]);

  const openProviderChat = (provider: TiffinProvider) => {
    let user: { id?: string | number; isGuest?: boolean } | null = null;
    try {
      user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    } catch {}
    if (!Number(user?.id) || user?.isGuest) {
      router.push("/login");
      return;
    }
    router.push(
      "/chat?user=" +
        encodeURIComponent(provider.name) +
        "&source=tiffin&tiffinProviderId=" +
        encodeURIComponent(provider.id),
    );
  };

  const openProviderRegistration = () => {
    try {
      const user = JSON.parse(localStorage.getItem("mcs_user") || "null");
      if (!Number(user?.id) || user?.isGuest) {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    setEditingProvider(null);
    setProviderOpen(true);
  };

  const deleteProvider = async (provider: TiffinProvider) => {
    if (
      !window.confirm(
        "Delete " +
          provider.name +
          "'s tiffin provider profile? This cannot be undone.",
      )
    )
      return;

    setDeletingProviderId(provider.id);
    try {
      const response = await fetch(
        "/api/v1/models/MCS_TiffinProvider/" + provider.id,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Could not delete tiffin provider profile",
        );
      }

      setTiffinData((current) =>
        current.filter((item) => item.id !== provider.id),
      );
      localStorage.removeItem("MCS_TiffinProvider_ID");
      try {
        const user = JSON.parse(localStorage.getItem("mcs_user") || "{}");
        const linkedProfileIds = { ...(user.linkedProfileIds || {}) };
        delete linkedProfileIds.MCS_TiffinProvider_ID;
        localStorage.setItem(
          "mcs_user",
          JSON.stringify({ ...user, linkedProfileIds }),
        );
        window.dispatchEvent(new Event("mcs_profile_change"));
      } catch {}
      toast.add("Tiffin provider profile deleted successfully.", "success");
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not delete tiffin provider profile",
        "error",
      );
    } finally {
      setDeletingProviderId("");
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tiffin Services"
        marathi="डबा"
        subtitle={`${loading ? "..." : tiffinData.length} home cooks · fresh daily · delivered across 6 cities worldwide`}
        actions={
          <>
            <Btn
              kind="dark"
              size="md"
              iconL="plus"
              onClick={openProviderRegistration}
            >
              Become a provider
            </Btn>
          </>
        }
      />

      <div className={`${styles.hero} mob-stack`}>
        <svg
          className={styles.rings}
          width="220"
          height="220"
          viewBox="0 0 220 220"
          aria-hidden="true"
        >
          <g fill="none" stroke="#fff" strokeWidth="1">
            <circle cx="110" cy="110" r="90" />
            <circle cx="110" cy="110" r="66" />
            <circle cx="110" cy="110" r="42" />
          </g>
        </svg>
        <div className={styles.heroContent}>
          <Tag color="#FFD89C" bg="rgba(255,216,156,0.15)">
            🍱 Ghar ka khana · घरचं जेवण
          </Tag>
          <h2 className={styles.heroTitle}>
            Real Maharashtrian cooking.
            <br />
            Delivered to your door.
          </h2>
          <p className={styles.heroText}>
            Community cooks making fresh, daily tiffin — the food you grew up
            on, wherever you are in the world.
          </p>
        </div>
      </div>

      {cityModalOpen && (
        <div
          className={styles.cityModalBackdrop}
          role="presentation"
          onMouseDown={() => setCityModalOpen(false)}
        >
          <section
            className={styles.cityModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tiffin-city-filter-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 id="tiffin-city-filter-title">Select city</h2>
                <p>
                  {location.country === "All"
                    ? "Showing cities from all countries"
                    : `Cities in ${location.country}`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close city filter"
                onClick={() => setCityModalOpen(false)}
              >
                ×
              </button>
            </header>
            <label className={styles.citySearch}>
              <Icon name="search" size={18} />
              <input
                autoFocus
                value={citySearch}
                onChange={(event) => setCitySearch(event.target.value)}
                placeholder="Search cities..."
                aria-label="Search cities"
              />
            </label>
            <div className={styles.cityList}>
              <button
                type="button"
                className={selectedCity === "All" ? styles.selectedCity : ""}
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
                      selectedCity === city.name ? styles.selectedCity : ""
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
          </section>
        </div>
      )}
      <div className={styles.searchRow}>
        <label className={styles.providerSearch}>
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search providers, dishes, cities..."
            aria-label="Search tiffin providers"
          />
        </label>
        <Btn
          kind="ghost"
          size="md"
          iconL="filter"
          className={styles.searchFilterButton}
          onClick={() => {
            setCitiesLoading(true);
            setCityModalOpen(true);
          }}
        >
          Filters
        </Btn>
      </div>
      <div className={styles.filters}>
        {filters.map((f) => (
          <Pill
            key={f}
            active={activeFilter === f}
            onClick={() => selectFilter(f)}
          >
            {f}
          </Pill>
        ))}
      </div>

      <section>
        <SectionHead
          title="Tiffin providers"
          subtitle={`${filtered.length} provider${filtered.length === 1 ? "" : "s"} · ${activeFilter}`}
          action={
            <select
              value={sortBy}
              onChange={(e) => selectSort(e.target.value)}
              className={styles.sort}
            >
              <option value="Nearest">Sort: Nearest</option>
              <option value="Rating">Sort: Rating</option>
              <option value="Orders">Sort: Orders</option>
            </select>
          }
        />
        {loading ? (
          <div className={styles.status}>Loading tiffin providers...</div>
        ) : filtered.length === 0 ? (
          <Card pad={32} className={styles.empty}>
            <div className={styles.emptyTitle}>
              No providers match this filter
            </div>
            <p className={styles.emptyText}>
              Try a different filter or become a provider.
            </p>
            <Btn
              kind="primary"
              size="md"
              iconL="plus"
              onClick={openProviderRegistration}
            >
              Become a provider
            </Btn>
          </Card>
        ) : (
          <>
            <div className={`${styles.grid} mob-stack`}>
              {visibleProviders.map((p, index) => (
                <Card
                  key={`${p.id}-${index}`}
                  interactive
                  className={styles.card}
                  onClick={() => router.push("/tiffin/" + p.id)}
                >
                  <div className={styles.cardHead}>
                    <div className={styles.iconWrap}>
                      <div
                        className={`${styles.providerIcon} ${styles[`toneBg_${p.tone}`]}`}
                      >
                        <Icon name="tiffin" size={26} color="currentColor" />
                      </div>
                    </div>
                    <div className={styles.identity}>
                      <Link
                        href={"/tiffin/" + p.id}
                        className={styles.nameLink}
                      >
                        <div className={styles.name}>{p.name}</div>
                      </Link>
                      <div className={styles.location}>
                        {p.city} · {p.mandal}
                      </div>
                      <div className={styles.rating}>
                        <Rating value={p.rating} />
                      </div>
                    </div>
                    <div className={styles.tags}>
                      <Tag
                        color={p.veg ? "#1F7A3A" : "#A8321F"}
                        bg={p.veg ? "#E1F2E6" : "#FAE0DA"}
                      >
                        {p.veg ? "🟢 Veg" : "🔴 Non-veg"}
                      </Tag>
                      {p.trial && (
                        <Tag color="#B84F12" bg="#FFE9D6">
                          Trial ✓
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div
                    className={`${styles.specialty} ${styles[`toneBg_${p.tone}`]}`}
                  >
                    <div
                      className={`${styles.specialtyLabel} ${styles[`toneColor_${p.tone}`]}`}
                    >
                      Specialty
                    </div>
                    <div className={styles.specialtyText}>{p.specialty}</div>
                  </div>
                  <div className={styles.menu}>
                    {p.menu.map((m) => (
                      <Tag key={m} color="#3A342B" bg="#F2EBD8">
                        {m}
                      </Tag>
                    ))}
                  </div>

                  <div className={styles.pricing}>
                    <div>
                      <div className={styles.priceLine}>
                        <span className={`${styles.price} num`}>
                          {p.perMeal}
                        </span>
                        <span className={styles.perMeal}>/ meal</span>
                      </div>
                      <div className={styles.month}>
                        {p.perMonth}/mo · {p.serviceDays} days
                      </div>
                    </div>
                    <div
                      className={styles.actions}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {p.owned ? (
                        <div className={styles.ownerActions}>
                          <button
                            type="button"
                            className={styles.editProvider}
                            onClick={() => {
                              setEditingProvider(p);
                              setProviderOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.deleteProvider}
                            disabled={deletingProviderId === p.id}
                            onClick={() => void deleteProvider(p)}
                          >
                            {deletingProviderId === p.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <Btn
                            kind="outline"
                            size="sm"
                            onClick={() => openProviderChat(p)}
                          >
                            <Icon name="chat" size={14} />
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {hasMore && (
              <div
                ref={sentinel}
                className={styles.loader}
                aria-label="Loading more tiffin providers"
              >
                Loading more providers...
              </div>
            )}
          </>
        )}
      </section>

      <BecomeTiffinProviderModal
        key={editingProvider ? "edit-" + editingProvider.id : "create"}
        isOpen={providerOpen}
        provider={editingProvider || undefined}
        onClose={() => {
          setProviderOpen(false);
          setEditingProvider(null);
        }}
        onCreated={async () => {
          const response = await fetch(
            "/api/v1/models/MCS_TiffinProvider?top=100&skip=0",
          );
          if (!response.ok) return;
          const data = await response.json();
          setTiffinData(Array.isArray(data.records) ? data.records : []);
          setEditingProvider(null);
        }}
      />
      <TiffinSubscribeModal
        isOpen={!!subTarget}
        onClose={() => setSubTarget(null)}
        providerName={subTarget?.name || ""}
        basePrice={subTarget?.price || ""}
      />
      <InfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="How it works"
        content={
          <ul className={styles.info}>
            <li>
              <b>Find a cook:</b> Browse authenticated community cooks in your
              area.
            </li>
            <li>
              <b>Try a trial box:</b> Many cooks offer a one-time trial box so
              you can taste the food.
            </li>
            <li>
              <b>Subscribe:</b> Set up a weekly or monthly plan directly with
              the provider.
            </li>
            <li>
              <b>Enjoy:</b> Get fresh, home-cooked Maharashtrian meals
              delivered.
            </li>
          </ul>
        }
      />
    </div>
  );
}
