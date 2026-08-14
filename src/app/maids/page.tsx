"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { Avatar, useGlobalToast } from "@/components/primitives";
import { helpers as fallbackHelpers } from "@/data/maids";
import { useLocation } from "@/components/LocationContext";
import styles from "./maids.module.css";
import BecomeMaidModal, { type EditableMaid } from "./BecomeMaidModal";

type Helper = (typeof fallbackHelpers)[number] & {
  owned?: boolean;
  phone?: string;
  categoryId?: string;
  currencyId?: string;
  countryId?: string;
  cityId?: string;
  rate?: string;
};
type BookingRequest = {
  id: string;
  name: string;
  address: string;
  notes: string;
  services: string[];
  created: string;
  status: "S" | "A" | "R";
};
type RegistrationUser = {
  name: string;
  phone: string;
  address: string;
  countryId: string;
  cityId: string;
};
type CityOption = {
  id: string;
  name: string;
  country?: string;
  countryId?: string;
};
const PAGE_SIZE = 12;

const filters = [
  "All",
  "Full Time",
  "Hourly",
  "Live in",
  "New",
  "Part Time",
  "Used",
] as const;

const normalizeCategory = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

function Rating({ value, jobs }: { value: number; jobs?: string }) {
  return (
    <div className={styles.rating}>
      <span>★</span> {value || "New"} {jobs && <em>· {jobs}</em>}
    </div>
  );
}

function HelperAvatar({
  helper,
  size = "regular",
}: {
  helper: Helper;
  size?: "regular" | "large";
}) {
  return (
    <div
      className={`${styles.avatar} ${size === "large" ? styles.avatarLarge : ""}`}
    >
      <Avatar name={helper.name} size={size === "large" ? 58 : 48} />
      {helper.verified && (
        <i>
          <Icon name="verify" size={12} color="#3b9b6f" />
        </i>
      )}
    </div>
  );
}

export default function MaidsPage() {
  const [helpers, setHelpers] = useState<Helper[]>(fallbackHelpers);
  const [nextSkip, setNextSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [maidsLoading, setMaidsLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const { location } = useLocation();
  const [selectedCity, setSelectedCity] = useState("All");
  const [showBecomeMaid, setShowBecomeMaid] = useState(true);
  const [isLoggedInMaid, setIsLoggedInMaid] = useState(false);
  const [bookingRequests, setBookingRequests] = useState<
    BookingRequest[] | null
  >(null);
  const [updatingBookingId, setUpdatingBookingId] = useState("");
  const router = useRouter();
  const toast = useGlobalToast();
  const [editingMaid, setEditingMaid] = useState<EditableMaid | null>(null);
  const [maidFormUser, setMaidFormUser] = useState<RegistrationUser | null>(
    null,
  );

  useEffect(() => {
    const syncButtonVisibility = () => {
      try {
        const user = JSON.parse(localStorage.getItem("mcs_user") || "null") as {
          id?: number | string;
          isGuest?: boolean;
          loginType?: string;
          MCS_LoginType?: string | { id?: string; identifier?: string };
          linkedProfileIds?: Record<string, string | number>;
        } | null;
        const isLoggedIn = Boolean(Number(user?.id)) && !user?.isGuest;
        const rawLoginType = user?.MCS_LoginType;
        const loginType = String(
          user?.loginType ||
            (typeof rawLoginType === "object"
              ? rawLoginType?.id || rawLoginType?.identifier
              : rawLoginType) ||
            localStorage.getItem("MCS_LoginType") ||
            "",
        ).toUpperCase();
        const storedMaidId = String(localStorage.getItem("MCS_Maid_ID") || "");
        const linkedMaidId = String(user?.linkedProfileIds?.MCS_Maid_ID || "");
        const ownsStoredMaidProfile = Boolean(
          isLoggedIn &&
          storedMaidId &&
          (storedMaidId === linkedMaidId ||
            storedMaidId === String(user?.id || "")),
        );
        setShowBecomeMaid(
          !isLoggedIn || (loginType === "E" && !ownsStoredMaidProfile),
        );
        setIsLoggedInMaid(ownsStoredMaidProfile);
      } catch {
        setShowBecomeMaid(true);
        setIsLoggedInMaid(false);
      }
    };
    const frame = requestAnimationFrame(syncButtonVisibility);
    window.addEventListener("storage", syncButtonVisibility);
    window.addEventListener("mcs_profile_change", syncButtonVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncButtonVisibility);
      window.removeEventListener("mcs_profile_change", syncButtonVisibility);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/models/MCS_Maid?top=${PAGE_SIZE}&skip=0`, {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load helpers")),
      )
      .then((data) => {
        if (!Array.isArray(data.records)) return;
        setHelpers(data.records);
        setNextSkip(data.records.length);
        setHasMore(data.records.length < Number(data["row-count"] || 0));
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          console.error("Maid services API error:", error);
      })
      .finally(() => setMaidsLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isLoggedInMaid) return;
    const controller = new AbortController();
    fetch("/api/v1/models/MCS_Maid_Booking", {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load booking requests")),
      )
      .then((data) =>
        setBookingRequests(Array.isArray(data.records) ? data.records : []),
      )
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Maid booking requests API error:", error);
          setBookingRequests([]);
        }
      });
    return () => controller.abort();
  }, [isLoggedInMaid]);
  const loadMoreMaids = useCallback(async () => {
    if (maidsLoading || !hasMore) return;
    setMaidsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/models/MCS_Maid?top=${PAGE_SIZE}&skip=${nextSkip}`,
      );
      if (!response.ok) throw new Error("Unable to load more helpers");
      const data = await response.json();
      const records: Helper[] = Array.isArray(data.records) ? data.records : [];
      setHelpers((current) => {
        const existingIds = new Set(current.map((helper) => helper.id));
        return [
          ...current,
          ...records.filter((helper) => !existingIds.has(helper.id)),
        ];
      });
      const newSkip = nextSkip + records.length;
      setNextSkip(newSkip);
      setHasMore(
        records.length > 0 && newSkip < Number(data["row-count"] || 0),
      );
    } catch (error) {
      console.error("Maid pagination API error:", error);
    } finally {
      setMaidsLoading(false);
    }
  }, [hasMore, maidsLoading, nextSkip]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMoreMaids();
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMoreMaids]);

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

  const openBecomeMaid = async (maid?: Helper) => {
    let user: {
      id?: number;
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      cityId?: string;
      countryId?: string;
      isGuest?: boolean;
    } = {};
    try {
      user = JSON.parse(localStorage.getItem("mcs_user") || "{}");
    } catch {}
    if (!Number(user.id) || user.isGuest) {
      router.push("/login");
      return;
    }

    let phone = String(user.phone || "");
    let address = String(user.address || user.city || "");
    let countryId = String(user.countryId || location.countryId || "");
    let cityId = String(user.cityId || "");
    try {
      const response = await fetch(
        `/api/data/profile?username=${encodeURIComponent(String(user.name || ""))}`,
      );
      const profiles = response.ok ? await response.json() : [];
      const profile = Array.isArray(profiles) ? profiles[0] : null;
      phone = String(profile?.phone || phone);
      address = String(profile?.address || profile?.city || address);
      countryId = String(profile?.countryId || countryId);
      cityId = String(profile?.cityId || cityId);
    } catch (error) {
      console.error("Maid registration profile loading error:", error);
    }
    setEditingMaid(maid ? { ...maid, id: String(maid.id) } : null);
    setMaidFormUser({
      name: String(user.name || "Community Member"),
      phone,
      address,
      countryId,
      cityId,
    });
  };

  const updateBookingStatus = async (
    bookingId: string,
    status: BookingRequest["status"],
  ) => {
    setUpdatingBookingId(bookingId);
    try {
      const response = await fetch("/api/v1/models/MCS_Maid_Booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not update booking status.");
      }
      setBookingRequests((current) =>
        current
          ? status === "S"
            ? current.map((request) =>
                request.id === bookingId ? { ...request, status } : request,
              )
            : current.filter((request) => request.id !== bookingId)
          : current,
      );
      const label =
        status === "A" ? "accepted" : status === "R" ? "rejected" : "submitted";
      toast.add(`Booking request marked ${label}.`, "success");
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not update booking status.",
        "error",
      );
    } finally {
      setUpdatingBookingId("");
    }
  };
  const openMaidDetails = (
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    maidId: string | number,
  ) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a, button, input, select, textarea")
    ) {
      return;
    }
    if ("key" in event && event.key !== "Enter" && event.key !== " ") return;
    router.push(`/maids/${maidId}`);
  };
  const openMaidChat = (maid: Helper) => {
    let user: { id?: number | string; isGuest?: boolean } | null = null;
    try {
      user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    } catch {}
    if (!Number(user?.id) || user?.isGuest) {
      router.push("/login");
      return;
    }
    router.push(
      `/chat?user=${encodeURIComponent(maid.name)}&source=maid&maidId=${encodeURIComponent(String(maid.id))}`,
    );
  };
  const deleteMaid = async (maid: Helper) => {
    if (
      !window.confirm(
        `Delete ${maid.name}'s maid profile? This cannot be undone.`,
      )
    )
      return;
    try {
      const response = await fetch(`/api/v1/models/MCS_Maid/${maid.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not delete maid profile");
      localStorage.removeItem("MCS_Maid_ID");
      toast.add("Maid profile deleted successfully.", "success");
      await refreshMaids();
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not delete maid profile",
        "error",
      );
    }
  };
  const refreshMaids = async () => {
    const response = await fetch(
      `/api/v1/models/MCS_Maid?top=${PAGE_SIZE}&skip=0`,
    );
    if (!response.ok) return;
    const data = await response.json();
    const records = Array.isArray(data.records) ? data.records : [];
    setHelpers(records);
    setNextSkip(records.length);
    setHasMore(records.length < Number(data["row-count"] || 0));
  };
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
    setCityModalOpen(false);
    setCitySearch("");
  };
  const results = useMemo(
    () =>
      helpers.filter((helper) => {
        const needle = query.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          [
            helper.name,
            helper.services,
            helper.location,
            ...helper.languages,
          ].some((value) => String(value).toLowerCase().includes(needle));
        const categoryText = normalizeCategory(
          `${helper.tag || ""} ${helper.services || ""}`,
        );
        const matchesFilter =
          activeFilter === "All" ||
          categoryText.includes(normalizeCategory(activeFilter));
        const matchesCity =
          selectedCity === "All" ||
          helper.location.toLowerCase().includes(selectedCity.toLowerCase());
        return matchesSearch && matchesFilter && matchesCity;
      }),
    [activeFilter, helpers, query, selectedCity],
  );

  const topRated = useMemo(
    () => [...results].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [results],
  );

  return (
    <div className={styles.page}>
      {maidFormUser && (
        <BecomeMaidModal
          user={maidFormUser}
          maid={editingMaid || undefined}
          onClose={() => {
            setMaidFormUser(null);
            setEditingMaid(null);
          }}
          onCreated={refreshMaids}
        />
      )}
      <header className={styles.intro}>
        <div>
          <h1>Maid Services</h1>
          <p>Trusted help from the Marathi community</p>
        </div>
        <div className={styles.introActions}>
          {showBecomeMaid && (
            <button
              className={styles.becomeMaidButton}
              type="button"
              onClick={() => void openBecomeMaid()}
            >
              <Icon name="plus" size={16} color="#fff" /> Become a Maid
            </button>
          )}
          <button className={styles.notification} aria-label="Notifications">
            <Icon name="bell" size={21} />
            <b>2</b>
          </button>
        </div>
      </header>

      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search maids, services, areas..."
            aria-label="Search helpers"
          />
        </label>
        <button
          className={styles.filterButton}
          type="button"
          onClick={() => {
            setCitiesLoading(true);
            setCityModalOpen(true);
          }}
        >
          <Icon name="filter" size={16} color="#fff" /> Filter
        </button>
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
            aria-labelledby="city-filter-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 id="city-filter-title">Select city</h2>
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

      <nav className={styles.filterTabs} aria-label="Maid filters">
        {filters.map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? styles.activeFilter : ""}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </nav>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Top Rated</h2>
          <p>Most trusted this month</p>
        </div>
        <div className={styles.topScroller}>
          {topRated.map((helper) => (
            <article className={styles.topCard} key={helper.id}>
              <div className={styles.topPerson}>
                <HelperAvatar helper={helper} size="large" />
                <div>
                  <h3>{helper.name}</h3>
                  <p>{helper.services}</p>
                  <Rating value={helper.rating} />
                </div>
              </div>
              <div className={styles.badges}>
                <span>{helper.experience}</span>
                <span>{helper.jobs}</span>
              </div>
              <p className={styles.meta}>
                <Icon name="pin" size={12} /> {helper.location}
                <Icon name="globe" size={11} /> {helper.languages.join(", ")}
              </p>
              <div className={styles.priceRow}>
                <div>
                  <small>Starting</small>
                  <strong>{helper.price}</strong>
                </div>
                <div className={styles.topCardActions}>
                  {!helper.owned && (
                    <button type="button" onClick={() => openMaidChat(helper)}>
                      <Icon name="chat" size={12} /> Chat
                    </button>
                  )}
                  <Link href={`/maids/${helper.id}`}>View</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isLoggedInMaid && Boolean(bookingRequests?.length) && (
        <section className={styles.bookingRequestsSection}>
          <div className={styles.bookingRequestsHeader}>
            <div>
              <h2>Booking Requests</h2>
              <p>Requests received for your maid services.</p>
            </div>
            {bookingRequests && <span>{bookingRequests.length}</span>}
          </div>
          {bookingRequests === null ? (
            <div className={styles.bookingRequestsStatus}>
              Loading booking requests...
            </div>
          ) : bookingRequests.length ? (
            <div className={styles.bookingRequestsGrid}>
              {bookingRequests.map((request) => (
                <article key={request.id}>
                  <header>
                    <strong>{request.name}</strong>
                    <div className={styles.bookingRequestControls}>
                      {request.created && (
                        <time dateTime={request.created}>
                          {new Date(request.created).toLocaleDateString()}
                        </time>
                      )}
                      <select
                        value={request.status}
                        disabled={updatingBookingId === request.id}
                        onChange={(event) =>
                          void updateBookingStatus(
                            request.id,
                            event.target.value as BookingRequest["status"],
                          )
                        }
                        aria-label={`Change booking status for ${request.name}`}
                      >
                        <option value="S">Received</option>
                        <option value="A">Accepted</option>
                        <option value="R">Rejected</option>
                      </select>
                    </div>
                  </header>
                  <div className={styles.bookingRequestServices}>
                    {request.services.map((service) => (
                      <span key={service}>{service}</span>
                    ))}
                  </div>
                  <p>
                    <Icon name="pin" size={13} />
                    {request.address || "Address not provided"}
                  </p>
                  {request.notes && <small>{request.notes}</small>}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.bookingRequestsStatus}>
              No booking requests received yet.
            </div>
          )}
        </section>
      )}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Available Near You</h2>
        </div>
        <div className={styles.helperGrid}>
          {results.map((helper) => (
            <article
              className={styles.helperCard}
              key={helper.id}
              role="link"
              tabIndex={0}
              onClick={(event) => openMaidDetails(event, helper.id)}
              onKeyDown={(event) => openMaidDetails(event, helper.id)}
              aria-label={`View ${helper.name}'s maid profile`}
            >
              <HelperAvatar helper={helper} />
              <div className={styles.helperInfo}>
                <div className={styles.nameLine}>
                  <h3>{helper.name}</h3>
                  {helper.verified && (
                    <Icon name="verify" size={12} color="#3b9b6f" />
                  )}
                  {helper.tag && <span>{helper.tag}</span>}
                </div>
                <p>{helper.services}</p>
                <Rating value={helper.rating} jobs={helper.jobs} />
                <small>
                  <Icon name="pin" size={11} /> {helper.location}
                </small>
                <small>
                  <Icon name="globe" size={11} /> {helper.languages.join(", ")}
                </small>
              </div>
              <div className={styles.cardAction}>
                <strong>{helper.price}</strong>
                <Link href={`/maids/${helper.id}`}>
                  Book <Icon name="arrow" size={13} />
                </Link>
                {!helper.owned && (
                  <button
                    type="button"
                    className={styles.maidCardChat}
                    onClick={() => openMaidChat(helper)}
                  >
                    <Icon name="chat" size={13} /> Chat
                  </button>
                )}
                {helper.owned && (
                  <div className={styles.ownerActions}>
                    <button
                      type="button"
                      onClick={() => void openBecomeMaid(helper)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMaid(helper)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        <div
          ref={loadMoreRef}
          className={styles.infiniteScrollStatus}
          aria-live="polite"
        >
          {maidsLoading && <span>Loading more helpers...</span>}
        </div>
        {!results.length && (
          <div className={styles.empty}>
            No helpers match your search. Try another service or area.
          </div>
        )}
      </section>
    </div>
  );
}
