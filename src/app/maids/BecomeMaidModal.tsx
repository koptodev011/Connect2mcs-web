"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useGlobalToast } from "@/components/primitives";
import styles from "./maids.module.css";

type LocationOption = {
  id: string | number;
  name?: string;
  Name?: string;
  code?: string;
};

type Currency = {
  id: string | number;
  ISO_Code?: string;
  CurSymbol?: string;
  Name?: string;
};

type PrefilledUser = {
  name: string;
  phone: string;
  address: string;
  countryId: string;
  cityId: string;
};

export type EditableMaid = {
  id: string;
  name: string;
  phone?: string;
  tag?: string;
  categoryId?: string;
  services: string;
  skills?: string[];
  experience: string;
  rate?: string;
  currencyId?: string;
  countryId?: string;
  cityId?: string;
  languages: string[];
  location: string;
  about: string;
};
function createdMaidId(value: unknown): number {
  if (typeof value === "number" || typeof value === "string") {
    const id = Number(value);
    return Number.isFinite(id) ? id : 0;
  }
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  const directKeys = ["maidId", "id", "MCS_Maid_ID"];
  for (const key of directKeys) {
    const id = createdMaidId(record[key]);
    if (id) return id;
  }
  if (Array.isArray(record.records) && record.records.length) {
    const id = createdMaidId(record.records[0]);
    if (id) return id;
  }
  return createdMaidId(record.record) || createdMaidId(record.data);
}
const categories = [
  { id: "FT", name: "Full Time" },
  { id: "H", name: "Hourly" },
  { id: "L", name: "Live in" },
  { id: "New", name: "New" },
  { id: "PT", name: "Part Time" },
  { id: "Used", name: "Used" },
];

export default function BecomeMaidModal({
  user,
  maid,
  onClose,
  onCreated,
}: {
  user: PrefilledUser;
  maid?: EditableMaid;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: maid?.name || user.name,
    phone: maid?.phone || user.phone,
    category: maid?.categoryId || "PT",
    services:
      maid?.skills?.join(", ") ||
      maid?.services.replace(/\s*(?:\u00b7|\u2022)\s*/g, ", ") ||
      "",
    experienceYears: maid?.experience.match(/\d+/)?.[0] || "",
    rate: maid?.rate || "",
    currencyId: maid?.currencyId || "",
    countryId: maid?.countryId || user.countryId,
    cityId: maid?.cityId || user.cityId,
    languages: maid?.languages.join(", ") || "",
    address: maid?.location || user.address,
    about: maid?.about || "",
  });
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useGlobalToast();
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/v1/models/C_Currency", { signal: controller.signal }).then(
        (response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("Could not load currencies")),
      ),
      fetch("/api/data/countries", { signal: controller.signal }).then(
        (response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("Could not load countries")),
      ),
      maid?.countryId || user.countryId
        ? fetch(
            `/api/v1/models/C_City?countryId=${encodeURIComponent(maid?.countryId || user.countryId)}`,
            { signal: controller.signal },
          ).then((response) =>
            response.ok
              ? response.json()
              : Promise.reject(new Error("Could not load cities")),
          )
        : Promise.resolve({ records: [] }),
    ])
      .then(([currencyData, countryData, cityData]) => {
        setCurrencies(
          Array.isArray(currencyData.records) ? currencyData.records : [],
        );
        setCountries(Array.isArray(countryData) ? countryData : []);
        setCities(Array.isArray(cityData.records) ? cityData.records : []);
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          toast.add("Could not load form options.", "error");
      });
    return () => controller.abort();
  }, [maid?.countryId, toast, user.countryId]);

  const selectCountry = async (countryId: string) => {
    set("countryId", countryId);
    set("cityId", "");
    setCities([]);
    if (!countryId) return;
    try {
      const response = await fetch(
        `/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`,
      );
      const data = response.ok ? await response.json() : { records: [] };
      setCities(Array.isArray(data.records) ? data.records : []);
    } catch {
      toast.add("Could not load cities for that country.", "error");
    }
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(
        maid ? `/api/v1/models/MCS_Maid/${maid.id}` : "/api/v1/models/MCS_Maid",
        {
          method: maid ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Name: form.name,
            Phone: form.phone,
            MCS_Maid_Category: form.category,
            MCS_Services: form.services,
            MCS_ExperienceYears: Number(form.experienceYears),
            MCS_Rate: Number(form.rate),
            C_Currency_ID: { id: Number(form.currencyId) },
            C_Country_ID: { id: Number(form.countryId) },
            C_City_ID: { id: Number(form.cityId) },
            MCS_Languages: form.languages,
            Address: form.address,
            MCS_About: form.about,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not create maid profile");
      const maidId = createdMaidId(result) || Number(maid?.id || 0);
      if (!maid && !maidId) {
        throw new Error(
          "Maid profile was created, but its ID was not returned.",
        );
      }
      if (maidId) {
        localStorage.setItem("MCS_Maid_ID", String(maidId));
        try {
          const savedUser = JSON.parse(
            localStorage.getItem("mcs_user") || "{}",
          ) as {
            linkedProfileIds?: Record<string, string>;
          };
          localStorage.setItem(
            "mcs_user",
            JSON.stringify({
              ...savedUser,
              linkedProfileIds: {
                ...savedUser.linkedProfileIds,
                MCS_Maid_ID: String(maidId),
              },
            }),
          );
          window.dispatchEvent(new Event("mcs_profile_change"));
        } catch {}
      }
      toast.add(
        `Your maid profile was ${maid ? "updated" : "created"} successfully.`,
        "success",
      );
      await onCreated();
      onClose();
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not create maid profile",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.maidFormBackdrop} onMouseDown={onClose}>
      <section
        className={styles.maidFormModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="become-maid-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="become-maid-title">
              {maid ? "Edit Maid Profile" : "Become a Maid"}
            </h2>
            <p>
              {maid
                ? "Update your service details."
                : "Create your service profile for the MCS community."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration form"
          >
            &times;
          </button>
        </header>
        <form onSubmit={submit}>
          <div className={styles.maidFormGrid}>
            <label>
              <span>Name</span>
              <input value={form.name} readOnly aria-readonly="true" />
            </label>
            <label>
              <span>Contact number</span>
              <input
                value={form.phone}
                readOnly
                aria-readonly="true"
                placeholder="Contact not available"
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Experience (years)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.experienceYears}
                onChange={(event) => set("experienceYears", event.target.value)}
                required
              />
            </label>
            <label className={styles.maidFormWide}>
              <span>Services</span>
              <input
                value={form.services}
                onChange={(event) => set("services", event.target.value)}
                placeholder="Cooking, Cleaning, Childcare"
                required
              />
            </label>
            <label>
              <span>Monthly/hourly rate</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(event) => set("rate", event.target.value)}
                required
              />
            </label>
            <label>
              <span>Currency</span>
              <select
                value={form.currencyId}
                onChange={(event) => set("currencyId", event.target.value)}
                required
              >
                <option value="">Select currency</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.ISO_Code ||
                      currency.CurSymbol ||
                      currency.Name ||
                      currency.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Country</span>
              <select
                value={form.countryId}
                onChange={(event) => void selectCountry(event.target.value)}
                required
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name || country.Name || country.code || country.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>City</span>
              <select
                value={form.cityId}
                onChange={(event) => set("cityId", event.target.value)}
                required
                disabled={!form.countryId}
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name || city.Name || city.id}
                  </option>
                ))}
              </select>
            </label>{" "}
            <label className={styles.maidFormWide}>
              <span>Languages</span>
              <input
                value={form.languages}
                onChange={(event) => set("languages", event.target.value)}
                placeholder="Marathi, Hindi, English"
                required
              />
            </label>
            <label className={styles.maidFormWide}>
              <span>Address</span>
              <textarea
                value={form.address}
                onChange={(event) => set("address", event.target.value)}
                placeholder="Full service address"
                required
              />
            </label>
            <label className={styles.maidFormWide}>
              <span>About</span>
              <textarea
                value={form.about}
                onChange={(event) => set("about", event.target.value)}
                placeholder="Tell families about your experience and work"
                required
              />
            </label>
          </div>
          <footer>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? (
                "Creating profile..."
              ) : (
                <>
                  {maid ? "Save Changes" : "Create Maid Profile"}{" "}
                  <Icon name="arrow" size={15} color="#fff" />
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
