"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { C } from "@/lib/tokens";
import Icon from "./Icon";
import { Avatar, Field, Modal, useGlobalToast } from "./primitives";
import { useMobileMenu } from "./MobileMenuContext";
import { useLocation } from "./LocationContext";
import styles from "./Header.module.css";
import searchStyles from "./HeaderSearch.module.css";

interface CountryOption {
  id: string;
  name: string;
  code: string;
  alpha3?: string;
}
interface CurrentUser {
  id?: number | string;
  name: string;
  city?: string;
  country?: string;
  countryId?: string;
  avatar?: string;
  isGuest?: boolean;
  loginType?: string;
}

const ALL_COUNTRIES: CountryOption = { id: "all", name: "All", code: "" };
const NOTIFICATIONS = [
  {
    id: "1",
    icon: "cal",
    color: C.saffron,
    title: "Marathi Food Festival is in 6 days",
    sub: "Edison, NJ · 412 going",
    time: "2h ago",
    read: false,
  },
  {
    id: "2",
    icon: "chat",
    color: C.blue,
    title: "Rahul Deshmukh sent you a message",
    sub: '"Hi, are you attending the event..."',
    time: "4h ago",
    read: false,
  },
  {
    id: "3",
    icon: "work",
    color: C.green,
    title: "New job match: Senior Designer at Infosys",
    sub: "Boston, MA · $120K–$160K",
    time: "1d ago",
    read: false,
  },
  {
    id: "4",
    icon: "people",
    color: C.brick,
    title: "Priya Joshi accepted your connection",
    sub: "Maharashtra Mandal London",
    time: "2d ago",
    read: true,
  },
  {
    id: "5",
    icon: "verify",
    color: C.green,
    title: "Your job application was viewed",
    sub: "Wipro Technologies · Product Manager",
    time: "3d ago",
    read: true,
  },
];

const SEARCH_SUGGESTIONS = [
  { label: "Maharashtra Mandal Boston", href: "/mandals" },
  { label: "Marathi Food Festival", href: "/events" },
  { label: "Senior Engineer jobs", href: "/jobs" },
  { label: "Pune Tiffin Service", href: "/tiffin" },
  { label: "Gudhi Padwa events", href: "/events" },
];

export default function Header() {
  const { setIsOpen } = useMobileMenu();
  const { location, setLocation } = useLocation();
  const toast = useGlobalToast();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [countries, setCountries] = useState<CountryOption[]>([ALL_COUNTRIES]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/data/countries")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load countries");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setCountries([ALL_COUNTRIES, ...data]);
      })
      .catch((error) => console.error("Countries API error:", error));
  }, []);

  useEffect(() => {
    async function loadUser(forceUserCountry = false) {
      const saved = localStorage.getItem("mcs_user");
      let user: CurrentUser | null = null;
      if (saved) {
        try {
          user = JSON.parse(saved);
        } catch {
          user = null;
        }
      }
      setCurrentUser(user);
      if (!user || user.isGuest) {
        setLocation({ city: "All", country: "All" });
        return;
      }
      let country = user.country || "";
      let countryId = user.countryId || "";
      try {
        const profileQuery = user.id
          ? `userId=${encodeURIComponent(String(user.id))}`
          : `username=${encodeURIComponent(user.name)}`;
        const response = await fetch(`/api/data/profile?${profileQuery}`, {
          cache: "no-store",
        });
        const profiles = response.ok ? await response.json() : [];
        const profile = Array.isArray(profiles) ? profiles[0] : null;
        if (profile) {
          country = String(profile.country || "");
          countryId = String(profile.countryId || "");
          const updatedUser = {
            ...user,
            country,
            countryId,
            city: String(profile.city || user.city || ""),
            loginType: String(profile.loginTypeId || user.loginType || ""),
          };
          localStorage.setItem("mcs_user", JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error("User country loading error:", error);
      }
      if (!countryId) {
        setLocation({ city: "All", country: "All" });
        return;
      }
      if (forceUserCountry || !localStorage.getItem("mcs_location"))
        setLocation({
          city: country || "All",
          country: country || "All",
          countryId,
        });
    }
    const handleAuthChange = () => {
      void loadUser(true);
    };
    void loadUser(false);
    window.addEventListener("mcs_auth_change", handleAuthChange);
    return () =>
      window.removeEventListener("mcs_auth_change", handleAuthChange);
  }, [setLocation]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const filteredCountries = countries.filter(
    (country) =>
      !citySearch ||
      country.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(citySearch.toLowerCase()),
  );
  const closeLocationModal = () => {
    setLocationModalOpen(false);
    setCitySearch("");
  };
  function handleCountrySelect(country: CountryOption) {
    setLocation({
      city: country.name,
      country: country.name,
      region: country.code || undefined,
      countryId: country.id === "all" ? "" : country.id,
    });
    closeLocationModal();
    toast.add(`Country set to ${country.name}`, "success");
    window.setTimeout(() => window.location.reload(), 50);
  }

  function handleSearch(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !searchQuery.trim()) return;
    setShowSearchSuggestions(false);
    const query = searchQuery.toLowerCase();
    const route =
      query.includes("mandal") || query.includes("community")
        ? "/mandals"
        : query.includes("event") || query.includes("festival")
          ? "/events"
          : query.includes("job") || query.includes("career")
            ? "/jobs"
            : query.includes("tiffin") || query.includes("food")
              ? "/tiffin"
              : query.includes("hous") || query.includes("room")
                ? "/housing"
                : "/mandals";
    window.location.assign(route);
    setSearchQuery("");
  }
  return (
    <>
      <header className={styles.header}>
        <div className={`mob-pad-x ${styles.inner}`}>
          <button
            className={`desktop-hide-flex ${styles.menuButton}`}
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="list" size={24} color={C.ink} />
          </button>
          <div className={styles.left}>
            <Link href="/" className={`desktop-hide-flex ${styles.mobileLogo}`}>
              <div className={styles.logoText}>Connect2MCS</div>
            </Link>
            <button
              className={`mob-hide ${styles.locationButton}`}
              onClick={() => setLocationModalOpen(true)}
            >
              <Icon name="pin" size={16} color={C.saffron} />
              <div className={styles.locationCopy}>
                <div className={styles.locationLabel}>YOU&rsquo;RE IN</div>
                <div className={styles.locationValue}>
                  {location.city}
                  {location.region ? `, ${location.region}` : ""}{" "}
                  <span className={styles.locationChange}>· change</span>
                </div>
              </div>
              <span className={styles.chevron}>
                <Icon name="chev" size={14} color={C.ink3} />
              </span>
            </button>
          </div>
          {/* <div className={`mob-hide ${searchStyles.container}`}>
            <div
              className={`${searchStyles.box} ${showSearchSuggestions ? searchStyles.boxFocused : ""}`}
            >
              <Icon name="search" size={18} color={C.ink3} />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearchSuggestions(event.target.value.length > 0);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() =>
                  window.setTimeout(() => setShowSearchSuggestions(false), 150)
                }
                onKeyDown={handleSearch}
                placeholder="Search mandals, events, jobs, gudhi padwa…"
                className={searchStyles.input}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchSuggestions(false);
                  }}
                  className={searchStyles.clearButton}
                >
                  <Icon name="plus" size={16} color={C.ink3} />
                </button>
              )}
            </div>
            {showSearchSuggestions && (
              <div className={searchStyles.suggestions}>
                <div className={searchStyles.suggestionsLabel}>
                  {searchQuery ? "Suggestions" : "Popular searches"}
                </div>
                {(searchQuery
                  ? SEARCH_SUGGESTIONS.filter((suggestion) =>
                      suggestion.label
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    )
                  : SEARCH_SUGGESTIONS
                ).map((suggestion) => (
                  <Link key={suggestion.label} href={suggestion.href}>
                    <div className={searchStyles.suggestion}>
                      <Icon name="search" size={14} color={C.ink3} />
                      {suggestion.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div> */}
          <div className={styles.actions}>
            <Link
              href="/chat"
              aria-label="Open chat"
              className={styles.plainLink}
            >
              <button className={styles.iconButton}>
                <Icon name="chat" size={18} color={C.ink2} />
                <span className={styles.chatBadge}>3</span>
              </button>
            </Link>
            <div ref={notifRef} className={styles.notificationWrap}>
              <button
                aria-label="Notifications"
                onClick={() => setNotifOpen((value) => !value)}
                className={`${styles.iconButton} ${styles.notificationButton} ${notifOpen ? styles.notificationButtonOpen : ""}`}
              >
                <Icon
                  name="bell"
                  size={18}
                  color={notifOpen ? C.saffronDk : C.ink2}
                />
                {unreadCount > 0 && <span className={styles.unreadBadge} />}
              </button>
              {notifOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <div>
                      <div className={styles.dropdownTitle}>Notifications</div>
                      {unreadCount > 0 && (
                        <div className={styles.unreadCount}>
                          {unreadCount} unread
                        </div>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() =>
                          setNotifications((previous) =>
                            previous.map((notification) => ({
                              ...notification,
                              read: true,
                            })),
                          )
                        }
                        className={styles.textButton}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() =>
                          setNotifications((previous) =>
                            previous.map((item) =>
                              item.id === notification.id
                                ? { ...item, read: true }
                                : item,
                            ),
                          )
                        }
                        className={`${styles.notification} ${!notification.read ? styles.notificationUnread : ""}`}
                      >
                        <div
                          className={`${styles.notificationIcon} ${styles[`notificationIcon${notification.icon[0].toUpperCase()}${notification.icon.slice(1)}`]}`}
                        >
                          <Icon
                            name={
                              notification.icon as Parameters<
                                typeof Icon
                              >[0]["name"]
                            }
                            size={18}
                            color={notification.color}
                          />
                        </div>
                        <div className={styles.notificationCopy}>
                          <div
                            className={`${styles.notificationTitle} ${!notification.read ? styles.notificationTitleUnread : ""}`}
                          >
                            {notification.title}
                          </div>
                          <div className={styles.notificationSub}>
                            {notification.sub}
                          </div>
                          <div className={styles.notificationTime}>
                            {notification.time}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className={styles.notificationDot} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className={styles.viewAll}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              href={currentUser ? "/profile" : "/login"}
              className={styles.plainLink}
            >
              <button className={styles.profileButton}>
                <Avatar name={currentUser?.name || "Guest"} size={32} />
                <div className={`mob-hide ${styles.profileCopy}`}>
                  <div className={styles.profileName}>
                    {currentUser ? currentUser.name.split(" ")[0] : "Guest"}
                  </div>
                  <div className={styles.profileMeta}>
                    {currentUser
                      ? `${({ S: "Student", J: "NRI", E: "Entrepreneur" } as Record<string, string>)[currentUser.loginType || ""] || ""} · ${currentUser.city || location.city}`
                      : "Sign in"}
                  </div>
                </div>
                <span className={styles.chevron}>
                  <Icon name="chev" size={14} color={C.ink3} />
                </span>
              </button>
            </Link>
          </div>
        </div>
      </header>
      <Modal
        isOpen={locationModalOpen}
        onClose={closeLocationModal}
        title="Change your location"
        marathi="स्थान बदला"
        width={440}
      >
        <Field
          label="Search country"
          value={citySearch}
          onChange={setCitySearch}
          placeholder="Boston, London, Pune…"
        />
        <div className={styles.countryList}>
          <div className={styles.countryHeading}>
            {citySearch ? "Results" : "Countries"}
          </div>
          {filteredCountries.length === 0 && (
            <div className={styles.emptyCountries}>No countries found</div>
          )}
          {filteredCountries.map((country) => {
            const selected = location.country === country.name;
            return (
              <button
                key={country.id}
                onClick={() => handleCountrySelect(country)}
                className={`${styles.countryButton} ${selected ? styles.countryButtonSelected : ""}`}
              >
                <Icon
                  name="pin"
                  size={16}
                  color={selected ? C.saffronDk : C.ink3}
                />
                <div>
                  <div
                    className={`${styles.countryName} ${selected ? styles.countryNameSelected : ""}`}
                  >
                    {country.name}
                  </div>
                  <div className={styles.countryCode}>
                    {country.code ||
                      (country.name === "All"
                        ? "Show data from every country"
                        : "")}
                  </div>
                </div>
                {selected && (
                  <div className={styles.currentCountry}>Current</div>
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}


