"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import Icon from "@/components/Icon";
import {
  Btn,
  Card,
  Modal,
  Tag,
  Avatar,
  ImgPh,
  SectionHead,
  PageHeader,
  Stat,
  useGlobalToast,
} from "@/components/primitives";
import Link from "next/link";
import type { CurrentUser } from "@/data/profile";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import styles from "./page.module.css";

type Tab = "overview" | "edit" | "preferences" | "subscription";
type LocationOption = { id: string; name: string };

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useGlobalToast();

  useEffect(() => {
    let profileIdentity = "";
    const saved = localStorage.getItem("mcs_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        profileIdentity = u.email || u.name;
      } catch {
        // ignore
      }
    }

    const url = `/api/data/profile${profileIdentity ? `?username=${encodeURIComponent(profileIdentity)}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setMe(data[0]);
          try {
            const savedUser = localStorage.getItem("mcs_user");
            if (savedUser) {
              const user = JSON.parse(savedUser);
              if (!user.isGuest) {
                const syncedUser = {
                  ...user,
                  id: data[0].id || user.id,
                  name: data[0].name || user.name,
                  email: data[0].email || user.email,
                  phone: data[0].phone || user.phone || "",
                  city: data[0].city || user.city,
                  cityId: data[0].cityId || user.cityId || "",
                  country: data[0].country || user.country,
                  countryId: data[0].countryId || user.countryId || "",
                  loginType: data[0].loginTypeId || data[0].type || user.loginType || "",
                };
                localStorage.setItem(
                  "mcs_user",
                  JSON.stringify(syncedUser),
                );
                window.dispatchEvent(new Event("mcs_auth_change"));
              }
            }
          } catch {}
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !me)
    return <div className={styles.inline1}>Loading profile...</div>;

  return (
    <div className={styles.inline2}>
      <PageHeader
        title="Your Profile"
        marathi="माझी खाती"
        subtitle="Manage your personal information, saved Mandals, and preferences"
        actions={
          <>
            <Btn
              kind="ghost"
              size="md"
              iconL="share"
              onClick={() => {
                if (navigator.share)
                  navigator.share({
                    title: "My Profile",
                    url: window.location.href,
                  });
                else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.add("Profile link copied!", "success");
                }
              }}
            >
              Share profile
            </Btn>
            <Btn
              kind="dark"
              size="md"
              iconL="settings"
              onClick={() => setTab("edit")}
            >
              Account settings
            </Btn>
            <Btn
              kind="outline"
              size="md"
              onClick={async () => {
                const token = localStorage.getItem("mcs_token");

                if (token) {
                  try {
                    const response = await fetch("/api/v1/auth/logout", {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      cache: "no-store",
                    });
                    if (!response.ok)
                      throw new Error(`Logout API returned ${response.status}`);
                  } catch (err) {
                    console.error("Error logging out from the API:", err);
                  }
                }

                if (auth.currentUser) {
                  try {
                    const userRef = doc(db, "users", auth.currentUser.uid);
                    await setDoc(
                      userRef,
                      { is_online: false, lastSeen: new Date() },
                      { merge: true },
                    );
                    await signOut(auth);
                  } catch (err) {
                    console.error(
                      "Error setting offline status on sign out:",
                      err,
                    );
                  }
                }
                localStorage.removeItem("mcs_user");
                localStorage.removeItem("mcs_token");
                localStorage.removeItem("MCS_LoginType");
                localStorage.removeItem("MCS_Maid_ID");
                localStorage.removeItem("MCS_Mentor_ID");
                localStorage.removeItem("MCS_TaxiDriver_ID");
                localStorage.removeItem("MCS_TiffinProvider_ID");
                localStorage.removeItem("mcs_location");
                window.dispatchEvent(new Event("mcs_auth_change"));
                window.dispatchEvent(new Event("mcs_location_change"));
                toast.add("Logged out successfully", "success");
                router.push("/login");
              }}
            >
              Log out
            </Btn>
          </>
        }
      />

      {/* Cover */}
      <Card pad={0} className={styles.inline3}>
        <ImgPh kind="ornament" tone="saffron" height={140} />
        <div className={`mob-stack ${styles.inline4}`}>
          <div className={styles.avatarWrap}>
            <Avatar name={me.name} size={128} />
          </div>
          <div className={styles.inline5}>
            <h2 className={styles.inline6}>
              {me.name}
              <span className={styles.inline7}>{me.marathi}</span>
              <Icon name="verify" size={20} color={C.green} />
            </h2>
            <div className={styles.inline8}>{me.role}</div>
            <div className={styles.inline9}>
              <span className={styles.inline10}>
                <Icon name="pin" size={13} color={C.ink3} /> {me.city} · from{" "}
                {me.country}
              </span>
              <span>·</span>
              <span>
                <strong className={styles.inline11}>{me.type}</strong> member of{" "}
                {me.mandal}
              </span>
              <span>·</span>
              <span>Joined {me.joined}</span>
            </div>
            <div className={styles.inline12}>
              {me.open.map((o) => (
                <Tag key={o} color={C.green} bg={C.greenLt}>
                  ● Open to {o}
                </Tag>
              ))}
            </div>
          </div>
          <div className={styles.inline13}>
            <Btn
              kind="primary"
              size="md"
              iconL="user"
              onClick={() => setTab("edit")}
            >
              Edit profile
            </Btn>
            <Btn
              kind="outline"
              size="md"
              onClick={() => {
                if (navigator.share)
                  navigator.share({
                    title: "My Profile",
                    url: window.location.href,
                  });
                else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.add("Profile link copied!", "success");
                }
              }}
            >
              <Icon name="share" size={16} />
            </Btn>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.inline14}>
        {(["overview", "edit", "preferences", "subscription"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${styles.tab} ${active ? styles.tabActive : "nav-int"}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview me={me} />}
      {tab === "edit" && (
        <EditPanel
          me={me}
          onSaved={(changes) =>
            setMe((current) => (current ? { ...current, ...changes } : current))
          }
        />
      )}
      {tab === "preferences" && <PreferencesPanel />}
      {tab === "subscription" && (
        <SubscriptionPanel
          me={me}
          onSaved={(changes) =>
            setMe((current) => (current ? { ...current, ...changes } : current))
          }
        />
      )}
    </div>
  );
}

function Overview({ me }: { me: CurrentUser }) {
  // Activity metrics (connections, RSVPs, saved) depend on backend tables that
  // don't exist yet, so surface real profile facts instead of fabricated counts.
  const facts = [
    { v: me.mandal, l: "Mandal" },
    { v: me.type, l: "Membership" },
    { v: me.city, l: "Based in" },
    { v: me.joined, l: "Member since" },
  ];
  return (
    <>
      {/* Profile facts */}
      <div className={`mob-2col ${styles.inline15}`}>
        {facts.map((s, i) => (
          <Card key={i} pad={20}>
            <Stat value={s.v} label={s.l} />
          </Card>
        ))}
      </div>

      <div className={`mob-stack ${styles.inline16}`}>
        {/* About + langs */}
        <Card pad={22}>
          <div className={styles.inline17}>About</div>
          <p className={styles.inline18}>{me.bio}</p>

          <div className={`mob-stack ${styles.inline19}`}>
            <div>
              <div className={styles.inline20}>Languages</div>
              <div className={styles.inline21}>
                {me.langs.map((lang, i) => {
                  const isDeva = lang !== "English";
                  return (
                    <Tag
                      key={i}
                      color={isDeva ? C.brick : C.ink2}
                      bg={isDeva ? "#FAE0DA" : C.bgDeep}
                      className={isDeva ? styles.devaTag : undefined}
                    >
                      {lang}
                    </Tag>
                  );
                })}
              </div>
            </div>
            <div>
              <div className={styles.inline22}>Contact</div>
              <div className={styles.inline23}>
                <div>{me.email}</div>
                <div className={styles.inline24}>{me.phone}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Saved Mandals */}
        <Card pad={0}>
          <div className={styles.inline25}>
            <div>
              <div className={styles.inline26}>Saved Mandals</div>
              <div className={styles.inline27}>
                Quick access while travelling
              </div>
            </div>
            <Link href="/mandals" className={styles.inline28}>
              <Btn kind="ghost" size="sm">
                Browse all
              </Btn>
            </Link>
          </div>
          <div className={styles.inline29}>
            <Icon name="heart" size={22} color={C.ink4} />
            <div className={styles.inline30}>No saved Mandals yet</div>
            <p className={styles.inline31}>
              Save Mandals for quick access while travelling.
            </p>
            <Link href="/mandals" className={styles.inline32}>
              <Btn kind="outline" size="sm">
                Browse Mandals
              </Btn>
            </Link>
          </div>
        </Card>
      </div>

      {/* Events RSVPs */}
      {/* <section className={styles.inline33}>
        <SectionHead title="Your events" subtitle="Upcoming RSVPs" />
        <Card pad={32} className={styles.inline34}>
          <Icon name="cal" size={24} color={C.ink4} />
          <div className={styles.inline35}>No events yet</div>
          <p className={styles.inline36}>
            RSVP to community events and they&rsquo;ll show up here.
          </p>
          <Link href="/events" className={styles.inline37}>
            <Btn kind="primary" size="md" iconL="cal">
              Explore events
            </Btn>
          </Link>
        </Card>
      </section> */}
    </>
  );
}

function EditPanel({
  me,
  onSaved,
}: {
  me: CurrentUser;
  onSaved: (changes: Partial<CurrentUser>) => void;
}) {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [countryId, setCountryId] = useState(me.countryId || "");
  const [cityId, setCityId] = useState(me.cityId || "");
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useGlobalToast();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/data/countries", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Could not load countries")),
      )
      .then((records: LocationOption[]) => {
        const options = (Array.isArray(records) ? records : []).map(
          (country) => ({ ...country, id: String(country.id) }),
        );
        const savedCountryId = String(me.countryId || "");
        const matchedCountryId =
          options.find(
            (country) =>
              country.name.trim().toLowerCase() ===
              me.country.trim().toLowerCase(),
          )?.id || "";
        setCountries(options);
        setCountryId(savedCountryId || matchedCountryId);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error("Unable to load countries:", error);
      })
      .finally(() => setLocationsLoading(false));
    return () => controller.abort();
  }, [me.country, me.countryId]);

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      return;
    }
    const controller = new AbortController();
    setCitiesLoading(true);
    fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Could not load cities")),
      )
      .then((payload: { records?: LocationOption[] }) => {
        const options = (
          Array.isArray(payload.records) ? payload.records : []
        ).map((city) => ({ ...city, id: String(city.id) }));
        const savedCityId = String(me.cityId || "");
        const matchedCityId =
          options.find(
            (city) =>
              city.name.trim().toLowerCase() === me.city.trim().toLowerCase(),
          )?.id || "";
        setCities(options);
        setCityId((current) => current || savedCityId || matchedCityId);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load cities:", error);
          setCities([]);
        }
      })
      .finally(() => setCitiesLoading(false));
    return () => controller.abort();
  }, [countryId, me.city, me.cityId]);
  async function saveLocation() {
    if (!countryId || !cityId) {
      toast.add("Please select country and city.", "error");
      return;
    }
    try {
      const savedUser = JSON.parse(localStorage.getItem("mcs_user") || "{}");
      const token = localStorage.getItem("mcs_token") || "";
      if (!savedUser.id || !token) throw new Error("Please sign in again.");
      setSaving(true);
      const response = await fetch(
        `/api/v1/models/ad_user/${encodeURIComponent(savedUser.id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            C_Country_ID: Number(countryId),
            C_City_ID: Number(cityId),
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Could not update location.");
      const country =
        countries.find((option) => String(option.id) === countryId)?.name || "";
      const city =
        cities.find((option) => String(option.id) === cityId)?.name || "";
      localStorage.setItem(
        "mcs_user",
        JSON.stringify({ ...savedUser, country, countryId, city, cityId }),
      );
      window.dispatchEvent(new Event("mcs_auth_change"));
      onSaved({ country, countryId, city, cityId });
      toast.add("Location updated successfully.", "success");
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not update location.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card pad={28}>
      <div className={`mob-stack ${styles.inline38}`}>
        <Field label="Display name" value={me.name} />
        <Field label="Marathi name" value={me.marathi} deva />
        <Field label="Email" value={me.email} />
        <Field label="Phone" value={me.phone} />
        <SelectField
          label="Country"
          value={countryId}
          disabled={locationsLoading}
          placeholder={
            locationsLoading ? "Loading countries..." : "Select country"
          }
          options={countries}
          onChange={(value) => {
            setCountryId(value);
            setCityId("");
          }}
        />
        <SelectField
          label="City"
          value={cityId}
          disabled={!countryId || citiesLoading}
          placeholder={
            citiesLoading
              ? "Loading cities..."
              : countryId
                ? "Select city"
                : "Select country first"
          }
          options={cities}
          onChange={setCityId}
        />
        <Field label="Origin" value={me.origin} />
        <Field label="Mandal" value={me.mandal} />
        <Field label="Member type" value={me.type} />
        <div className={styles.inline39}>
          <Field label="Bio" multiline value={me.bio} />
        </div>
      </div>
      <div className={styles.inline40}>
        <Btn
          kind="primary"
          size="md"
          onClick={saveLocation}
          disabled={saving || !countryId || !cityId}
        >
          {saving ? "Saving..." : "Save changes"}
        </Btn>
        <Btn kind="ghost" size="md">
          Cancel
        </Btn>
      </div>
    </Card>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: LocationOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.inline41}>
      <div className={styles.inline42}>{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={styles.control}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  multiline,
  deva,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  deva?: boolean;
}) {
  return (
    <label className={styles.inline43}>
      <div className={styles.inline44}>{label}</div>
      {multiline ? (
        <textarea defaultValue={value} rows={3} className={styles.inline45} />
      ) : (
        <input
          defaultValue={value}
          className={`${styles.control} ${deva ? styles.devaControl : ""}`}
        />
      )}
    </label>
  );
}

function PreferencesPanel() {
  return (
    <Card pad={28}>
      <div className={styles.inline46}>
        <Group title="Language">
          <Toggle label="Show Marathi alongside English where available" on />
          <Toggle label="Date format · DD/MM/YYYY (Indian)" on />
        </Group>
        <Group title="Notifications">
          <Toggle label="New events near my city" on />
          <Toggle label="Job matches in my field" on />
          <Toggle label="Mandal community updates" on />
          <Toggle label="Weekly digest email" on={false} />
        </Group>
        <Group title="Privacy">
          <Toggle label="Show my profile to all members" on />
          <Toggle label="Allow connection requests from anyone" on={false} />
          <Toggle label="Show me on the global Mandal map" on />
        </Group>
      </div>
      <div className={styles.inline47}>
        <Btn kind="primary" size="md">
          Save preferences
        </Btn>
      </div>
    </Card>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.inline48}>
      <div className={styles.inline49}>{title}</div>
      <div className={styles.inline50}>{children}</div>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button onClick={() => setV(!v)} className={`btn-int ${styles.inline51}`}>
      <span className={styles.inline52}>{label}</span>
      <span
        className={`${styles.toggleTrack} ${v ? styles.toggleTrackOn : ""}`}
      >
        <span
          className={`${styles.toggleThumb} ${v ? styles.toggleThumbOn : ""}`}
        />
      </span>
    </button>
  );
}

type PlanKey = "S" | "J" | "E";

const PLAN_ORDER: PlanKey[] = ["S", "J", "E"];

const PLAN_META: Record<
  PlanKey,
  {
    code: PlanKey;
    label: string;
    marathi: string;
    icon: "grad" | "globe" | "work";
    tagline: string;
    price: string;
    per: string;
    tone: string;
    toneBg: string;
    features: string[];
  }
> = {
  S: {
    code: "S",
    label: "Student",
    marathi: "विद्यार्थी",
    icon: "grad",
    tagline: "For students finding their path",
    price: "Free",
    per: "forever",
    tone: C.blue,
    toneBg: "#DCE5F4",
    features: [
      "Community & mandal access",
      "Events, jobs & scholarships",
      "Mentorship matching",
    ],
  },
  J: {
    code: "J",
    label: "NRI",
    marathi: "एनआरआय",
    icon: "globe",
    tagline: "For members living abroad",
    price: "₹999",
    per: "/ year",
    tone: C.saffron,
    toneBg: C.saffronLt,
    features: [
      "Everything in Student",
      "Housing & taxi services",
      "Exclusive member offers & discounts",
    ],
  },
  E: {
    code: "E",
    label: "Entrepreneur",
    marathi: "उद्योजक",
    icon: "work",
    tagline: "For founders & business owners",
    price: "₹1,999",
    per: "/ year",
    tone: C.green,
    toneBg: C.greenLt,
    features: [
      "Everything in NRI",
      "Business directory listing",
      "Verified business badge & promotion",
    ],
  },
};

function resolvePlan(type: string, loginTypeId?: string): PlanKey {
  const raw = String(loginTypeId || type || "").trim();
  const upper = raw.toUpperCase();
  if (upper === "E") return "E";
  if (upper === "J") return "J";
  if (upper === "S") return "S";
  const lower = raw.toLowerCase();
  if (lower.includes("entrepreneur") || lower.includes("founder"))
    return "E";
  if (lower.includes("nri") || lower.includes("non-resident")) return "J";
  if (lower.includes("student")) return "S";
  return "S";
}

function SubscriptionPanel({
  me,
  onSaved,
}: {
  me: CurrentUser;
  onSaved: (changes: Partial<CurrentUser>) => void;
}) {
  const toast = useGlobalToast();
  const [currentPlan, setCurrentPlan] = useState<PlanKey>(() =>
    resolvePlan(me.type, me.loginTypeId),
  );
  const [confirmPlan, setConfirmPlan] = useState<PlanKey | null>(null);
  const [saving, setSaving] = useState<PlanKey | null>(null);

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const meta = PLAN_META[currentPlan];

  async function upgrade(target: PlanKey) {
    const token = localStorage.getItem("mcs_token");
    const savedUser = JSON.parse(localStorage.getItem("mcs_user") || "{}");
    if (!savedUser.id || !token) {
      toast.add("Please sign in to upgrade your plan.", "error");
      return;
    }
    setSaving(target);
    try {
      const response = await fetch("/api/v1/subscription", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: target }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Could not upgrade plan.");
      setCurrentPlan(target);
      localStorage.setItem(
        "mcs_user",
        JSON.stringify({ ...savedUser, loginType: target }),
      );
      localStorage.setItem("MCS_LoginType", target);
      window.dispatchEvent(new Event("mcs_auth_change"));
      onSaved({ type: PLAN_META[target].label, loginTypeId: target });
      toast.add(
        result.message || `Upgraded to ${PLAN_META[target].label} plan`,
        "success",
      );
      setConfirmPlan(null);
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not upgrade plan.",
        "error",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <Card pad={22} className={styles.subSummary}>
        <span
          className={styles.subSummaryIcon}
          style={{ background: meta.toneBg, color: meta.tone }}
        >
          <Icon name={meta.icon} size={22} color={meta.tone} />
        </span>
        <div className={styles.subSummaryBody}>
          <div className={styles.subSummaryLabel}>Current plan</div>
          <div className={styles.subSummaryTitle}>
            {meta.label}
            <span className={styles.subSummaryMarathi}>{meta.marathi}</span>
          </div>
          <div className={styles.subSummaryMeta}>
            {meta.price} {meta.per} · renews automatically
          </div>
        </div>
        <Tag color={meta.tone} bg={meta.toneBg}>
          {meta.code}
        </Tag>
      </Card>

      <div className={styles.subPlans}>
        {PLAN_ORDER.map((key) => {
          const p = PLAN_META[key];
          const idx = PLAN_ORDER.indexOf(key);
          const isCurrent = key === currentPlan;
          const isUpgrade = idx > currentIdx;
          return (
            <Card
              key={key}
              pad={20}
              className={styles.subPlan}
              style={
                isCurrent
                  ? { borderColor: p.tone, boxShadow: `0 0 0 1px ${p.tone}` }
                  : undefined
              }
            >
              <div className={styles.subPlanHead}>
                <span
                  className={styles.subPlanIcon}
                  style={{ background: p.toneBg, color: p.tone }}
                >
                  <Icon name={p.icon} size={20} color={p.tone} />
                </span>
                {isCurrent && (
                  <Tag color="#fff" bg={p.tone}>
                    Current
                  </Tag>
                )}
              </div>
              <div className={styles.subPlanName}>{p.label}</div>
              <div className={styles.subPlanMarathi}>{p.marathi}</div>
              <div className={styles.subPlanTagline}>{p.tagline}</div>
              <div className={styles.subPlanPrice}>
                {p.price}
                <span className={styles.subPlanPer}>{p.per}</span>
              </div>
              <ul className={styles.subPlanFeatures}>
                {p.features.map((f) => (
                  <li key={f} className={styles.subPlanFeature}>
                    <span className={styles.subPlanTick}>
                      <Icon name="verify" size={14} color={C.green} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Btn kind="soft" size="md" full disabled>
                  Current plan
                </Btn>
              ) : isUpgrade ? (
                <Btn
                  kind="primary"
                  size="md"
                  full
                  iconL="arrow"
                  onClick={() => setConfirmPlan(key)}
                >
                  Upgrade to {p.label}
                </Btn>
              ) : (
                <Btn kind="ghost" size="md" full disabled>
                  Included in your plan
                </Btn>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={confirmPlan !== null}
        onClose={() => setConfirmPlan(null)}
        title="Upgrade plan"
        marathi="सदस्यत्व वाढवा"
        width={420}
      >
        {confirmPlan && (
          <div className={styles.subConfirm}>
            <span
              className={styles.subConfirmIcon}
              style={{
                background: PLAN_META[confirmPlan].toneBg,
                color: PLAN_META[confirmPlan].tone,
              }}
            >
              <Icon
                name={PLAN_META[confirmPlan].icon}
                size={26}
                color={PLAN_META[confirmPlan].tone}
              />
            </span>
            <div className={styles.subConfirmTitle}>
              Switch to the {PLAN_META[confirmPlan].label} plan?
            </div>
            <p className={styles.subConfirmText}>
              Your membership will upgrade from{" "}
              <strong>{PLAN_META[currentPlan].label}</strong> to{" "}
              <strong>{PLAN_META[confirmPlan].label}</strong> for{" "}
              <strong>
                {PLAN_META[confirmPlan].price}
                {PLAN_META[confirmPlan].per}
              </strong>
              . Billing is annual and can be cancelled anytime.
            </p>
            <div className={styles.subConfirmActions}>
              <Btn
                kind="ghost"
                size="md"
                onClick={() => setConfirmPlan(null)}
              >
                Cancel
              </Btn>
              <Btn
                kind="primary"
                size="md"
                onClick={() => upgrade(confirmPlan)}
                disabled={saving !== null}
              >
                {saving === confirmPlan
                  ? "Upgrading..."
                  : `Confirm · ${PLAN_META[confirmPlan].label}`}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
