"use client";

import { useEffect, useState } from "react";
import { useGlobalToast } from "@/components/primitives";
import type { TiffinProvider } from "@/data/tiffin";
import styles from "./provider-form.module.css";

type Option = {
  id: string | number;
  name?: string;
  Name?: string;
  Value?: string;
};
type Currency = Option & { ISO_Code?: string; CurSymbol?: string };
type Category = Option & { identifier?: string };

const initialForm = {
  name: "",
  email: "",
  phone: "",
  countryId: "",
  cityId: "",
  currencyId: "",
  about: "",
  deliveryInfo: "",
  experienceYears: "",
  isVeg: true,
  menu: "",
  pricePerMeal: "",
  pricePerMonth: "",
  specialty: "",
  serviceDays: "",
  categoryId: "",
};

const editForm = (provider: TiffinProvider) => ({
  ...initialForm,
  name: provider.name,
  countryId: provider.countryId || "",
  cityId: provider.cityId || "",
  currencyId: provider.currencyId || "",
  about: provider.about || "",
  deliveryInfo: provider.deliveryInfo || "",
  experienceYears:
    provider.experienceYears != null ? String(provider.experienceYears) : "",
  isVeg: provider.veg,
  menu: provider.menu.join(", "),
  pricePerMeal:
    provider.pricePerMeal != null ? String(provider.pricePerMeal) : "",
  pricePerMonth:
    provider.pricePerMonth != null ? String(provider.pricePerMonth) : "",
  specialty: provider.specialty,
  serviceDays: String(provider.serviceDays),
  categoryId: provider.categoryId || "",
});

export default function BecomeTiffinProviderModal({
  isOpen,
  onClose,
  onCreated,
  provider,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
  provider?: TiffinProvider;
}) {
  const [form, setForm] = useState(() =>
    provider ? editForm(provider) : initialForm,
  );
  const [countries, setCountries] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useGlobalToast();
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    let savedUser: Record<string, unknown> = {};
    try {
      savedUser = JSON.parse(localStorage.getItem("mcs_user") || "{}");
    } catch {}
    const name = String(savedUser.name || "");
    const countryId = String(provider?.countryId || savedUser.countryId || "");
    const cityId = String(provider?.cityId || savedUser.cityId || "");

    const profileRequest = name
      ? fetch("/api/data/profile?username=" + encodeURIComponent(name), {
          signal: controller.signal,
        }).then((response) => (response.ok ? response.json() : []))
      : Promise.resolve([]);
    Promise.all([
      fetch("/api/data/countries", { signal: controller.signal }).then(
        (response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("countries")),
      ),
      fetch("/api/v1/models/C_Currency", { signal: controller.signal }).then(
        (response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("currencies")),
      ),
      fetch("/api/v1/models/MCS_Tiffin_Category", {
        signal: controller.signal,
      }).then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("categories")),
      ),
      countryId
        ? fetch(
            "/api/v1/models/C_City?countryId=" + encodeURIComponent(countryId),
            {
              signal: controller.signal,
            },
          ).then((response) =>
            response.ok ? response.json() : { records: [] },
          )
        : Promise.resolve({ records: [] }),
      profileRequest,
    ])
      .then(([countryData, currencyData, categoryData, cityData, profiles]) => {
        setCountries(Array.isArray(countryData) ? countryData : []);
        setCurrencies(
          Array.isArray(currencyData.records) ? currencyData.records : [],
        );
        setCategories(
          Array.isArray(categoryData.records) ? categoryData.records : [],
        );
        setCities(Array.isArray(cityData.records) ? cityData.records : []);
        const profile = Array.isArray(profiles) ? profiles[0] : undefined;
        setForm((current) => ({
          ...current,
          name: String(provider?.name || profile?.name || savedUser.name || ""),
          email: String(profile?.email || savedUser.email || ""),
          phone: String(profile?.phone || savedUser.phone || ""),
          countryId: String(
            provider?.countryId ||
              profile?.countryId ||
              savedUser.countryId ||
              countryId,
          ),
          cityId: String(
            provider?.cityId || profile?.cityId || savedUser.cityId || cityId,
          ),
          currencyId: String(provider?.currencyId || ""),
          about: String(provider?.about || ""),
          deliveryInfo: String(provider?.deliveryInfo || ""),
          experienceYears:
            provider?.experienceYears != null
              ? String(provider.experienceYears)
              : "",
          isVeg: provider?.veg ?? true,
          menu: provider?.menu.join(", ") || "",
          pricePerMeal:
            provider?.pricePerMeal != null ? String(provider.pricePerMeal) : "",
          pricePerMonth:
            provider?.pricePerMonth != null
              ? String(provider.pricePerMonth)
              : "",
          specialty: String(provider?.specialty || ""),
          serviceDays:
            provider?.serviceDays != null ? String(provider.serviceDays) : "",
          categoryId: String(provider?.categoryId || ""),
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          toast.add("Could not load form options.", "error");
      });
    return () => controller.abort();
  }, [isOpen, provider, toast]);

  const selectCountry = async (countryId: string) => {
    set("countryId", countryId);
    set("cityId", "");
    setCities([]);
    if (!countryId) return;
    try {
      const response = await fetch(
        "/api/v1/models/C_City?countryId=" + encodeURIComponent(countryId),
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
        provider
          ? "/api/v1/models/MCS_TiffinProvider/" + provider.id
          : "/api/v1/models/MCS_TiffinProvider",
        {
          method: provider ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            C_Country_ID: { id: Number(form.countryId) },
            C_City_ID: { id: Number(form.cityId) },
            C_Currency_ID: { id: Number(form.currencyId) },
            MCS_About: form.about,
            MCS_DeliveryInfo: form.deliveryInfo,
            MCS_ExperienceYears: Number(form.experienceYears),
            MCS_IsVeg: form.isVeg,
            MCS_Menu: form.menu,
            MCS_PricePerMeal: Number(form.pricePerMeal),
            MCS_PricePerMonth: Number(form.pricePerMonth),
            MCS_Specialty: form.specialty,
            MCS_ServiceDays: form.serviceDays,
            MCS_Tiffin_Category_ID: { id: Number(form.categoryId) },
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not create provider profile");
      const providerId = provider
        ? Number(provider.id)
        : Number(result.id || result.record?.id || result.data?.id || 0);
      if (!provider && providerId) {
        localStorage.setItem("MCS_TiffinProvider_ID", String(providerId));
        try {
          const user = JSON.parse(localStorage.getItem("mcs_user") || "{}");
          localStorage.setItem(
            "mcs_user",
            JSON.stringify({
              ...user,
              linkedProfileIds: {
                ...user.linkedProfileIds,
                MCS_TiffinProvider_ID: String(providerId),
              },
            }),
          );
          window.dispatchEvent(new Event("mcs_profile_change"));
        } catch {}
      }
      toast.add(
        provider
          ? "Tiffin provider profile updated successfully."
          : "Your tiffin provider profile was created successfully.",
        "success",
      );
      await onCreated();
      setForm(initialForm);
      onClose();
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not create provider profile",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const optionName = (option: Option) =>
    String(option.name || option.Name || option.Value || "Option");

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="provider-form-title">
              {provider ? "Edit Tiffin Provider" : "Become a Tiffin Provider"}
            </h2>
            <p>
              {provider
                ? "Update your cooking and delivery profile."
                : "Create your cooking and delivery profile for the community."}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          <div className={styles.grid}>
            <label>
              <span>Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </label>
            <label>
              <span>Contact number</span>
              <input
                required
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </label>
            <label>
              <span>Country</span>
              <select
                required
                value={form.countryId}
                onChange={(e) => void selectCountry(e.target.value)}
              >
                <option value="">Select country</option>
                {countries.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionName(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>City</span>
              <select
                required
                value={form.cityId}
                onChange={(e) => set("cityId", e.target.value)}
              >
                <option value="">Select city</option>
                {cities.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionName(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Currency</span>
              <select
                required
                value={form.currencyId}
                onChange={(e) => set("currencyId", e.target.value)}
              >
                <option value="">Select currency</option>
                {currencies.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.CurSymbol || option.ISO_Code || optionName(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Experience in years</span>
              <input
                required
                min="0"
                type="number"
                value={form.experienceYears}
                onChange={(e) => set("experienceYears", e.target.value)}
              />
            </label>
            <label>
              <span>Tiffin category</span>
              <select
                required
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                <option value="">Select category</option>
                {categories
                  .filter((option) => option.id)
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {optionName(option)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Price per meal</span>
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.pricePerMeal}
                onChange={(e) => set("pricePerMeal", e.target.value)}
              />
            </label>
            <label>
              <span>Price per month</span>
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.pricePerMonth}
                onChange={(e) => set("pricePerMonth", e.target.value)}
              />
            </label>
            <label className={styles.wide}>
              <span>Specialty</span>
              <input
                required
                value={form.specialty}
                onChange={(e) => set("specialty", e.target.value)}
                placeholder="Maharashtrian home-style, Jain options…"
              />
            </label>
            <label className={styles.wide}>
              <span>Menu</span>
              <textarea
                required
                rows={3}
                value={form.menu}
                onChange={(e) => set("menu", e.target.value)}
                placeholder="Varan-bhaat, Poli-bhaji, Usal…"
              />
            </label>
            <label>
              <span>Service days</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.serviceDays}
                onChange={(e) => set("serviceDays", e.target.value)}
                placeholder="5"
              />
            </label>
            <label className={styles.wide}>
              <span>Delivery information</span>
              <textarea
                required
                rows={2}
                value={form.deliveryInfo}
                onChange={(e) => set("deliveryInfo", e.target.value)}
              />
            </label>
            <label className={styles.wide}>
              <span>About</span>
              <textarea
                required
                rows={3}
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
              />
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.isVeg}
                onChange={(e) => set("isVeg", e.target.checked)}
              />
              <span>Vegetarian provider</span>
            </label>
          </div>
          <footer>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submit}
              disabled={submitting}
            >
              {submitting
                ? provider
                  ? "Saving changes..."
                  : "Creating profile..."
                : provider
                  ? "Save changes"
                  : "Create provider profile"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
