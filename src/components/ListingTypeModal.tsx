"use client";

import { useEffect, useState } from "react";
import BecomeMaidModal from "@/app/maids/BecomeMaidModal";
import BecomeTiffinProviderModal from "@/app/tiffin/BecomeTiffinProviderModal";
import { Btn, Field, Modal, useGlobalToast } from "@/components/primitives";
import styles from "./ListingTypeModal.module.css";

type ListingKind = "" | "business" | "services";
type ServiceKind = "" | "maid" | "tiffin" | "taxi";
type Option = { id: string; name: string };
type LanguageOption = { code: string; name: string };
type RegistrationUser = {
  name: string;
  phone: string;
  address: string;
  countryId: string;
  cityId: string;
};

const EMPTY_USER: RegistrationUser = {
  name: "",
  phone: "",
  address: "",
  countryId: "",
  cityId: "",
};

const EMPTY_TAXI_FORM = {
  vehicle: "",
  vehicleType: "",
  baseFare: "",
  countryId: "",
  cityId: "",
  phone: "",
  complementaryFood: "",
  language: "",
  serviceAreaIds: [] as string[],
};

export default function ListingTypeModal({
  isOpen,
  onClose,
  onBusiness,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onBusiness: () => void;
  onCreated?: () => void;
}) {
  const toast = useGlobalToast();
  const [listingKind, setListingKind] = useState<ListingKind>("");
  const [serviceKind, setServiceKind] = useState<ServiceKind>("");
  const [user, setUser] = useState<RegistrationUser | null>(null);
  const [countries, setCountries] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [taxiForm, setTaxiForm] = useState(EMPTY_TAXI_FORM);
  const [submittingTaxi, setSubmittingTaxi] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    let savedUser: Record<string, unknown> = {};
    try {
      savedUser = JSON.parse(localStorage.getItem("mcs_user") || "{}");
    } catch {}

    const savedName = String(savedUser.name || "");
    const profileRequest = savedName
      ? fetch("/api/data/profile?username=" + encodeURIComponent(savedName), {
          signal: controller.signal,
          cache: "no-store",
        }).then((response) => (response.ok ? response.json() : []))
      : Promise.resolve([]);

    Promise.all([
      fetch("/api/data/countries", {
        signal: controller.signal,
        cache: "no-store",
      }).then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("countries")),
      ),
      fetch("/api/v1/models/AD_Language", {
        signal: controller.signal,
        cache: "no-store",
      }).then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("languages")),
      ),
      profileRequest,
    ])
      .then(([countryData, languageData, profiles]) => {
        const profile = Array.isArray(profiles) ? profiles[0] : undefined;
        const loadedUser = {
          name: String(profile?.name || savedUser.name || ""),
          phone: String(profile?.phone || savedUser.phone || ""),
          address: String(profile?.address || savedUser.address || ""),
          countryId: String(profile?.countryId || savedUser.countryId || ""),
          cityId: String(profile?.cityId || savedUser.cityId || ""),
        };
        setUser(loadedUser);
        setCountries(
          (Array.isArray(countryData) ? countryData : [])
            .map((item) => ({
              id: String(item.id || ""),
              name: String(item.name || item.Name || ""),
            }))
            .filter((item) => item.id && item.name),
        );
        setLanguages(
          (Array.isArray(languageData.records) ? languageData.records : [])
            .map((item: Record<string, unknown>) => ({
              code: String(item.code || item.Value || item.id || ""),
              name: String(item.name || item.Name || item.identifier || ""),
            }))
            .filter((item: LanguageOption) => item.code && item.name),
        );
        setTaxiForm((current) => ({
          ...current,
          countryId: current.countryId || loadedUser.countryId,
          cityId: current.cityId || loadedUser.cityId,
          phone: current.phone || loadedUser.phone,
        }));
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Service listing options failed:", error);
          toast.add("Could not load service form options.", "error");
          setUser(EMPTY_USER);
        }
      });

    return () => controller.abort();
  }, [isOpen, toast]);

  useEffect(() => {
    if (!isOpen || serviceKind !== "taxi" || !taxiForm.countryId) return;
    const controller = new AbortController();
    fetch(
      "/api/v1/models/C_City?countryId=" +
        encodeURIComponent(taxiForm.countryId),
      { signal: controller.signal, cache: "no-store" },
    )
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("cities")),
      )
      .then((data) =>
        setCities(Array.isArray(data.records) ? data.records : []),
      )
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast.add("Could not load cities.", "error");
        }
      });
    return () => controller.abort();
  }, [isOpen, serviceKind, taxiForm.countryId, toast]);

  function close() {
    setListingKind("");
    setServiceKind("");
    setTaxiForm(EMPTY_TAXI_FORM);
    setCities([]);
    onClose();
  }

  function chooseBusiness() {
    close();
    onBusiness();
  }

  async function serviceCreated() {
    onCreated?.();
    close();
  }

  async function submitTaxi() {
    if (
      !taxiForm.vehicle.trim() ||
      !taxiForm.vehicleType.trim() ||
      !taxiForm.countryId ||
      !taxiForm.cityId ||
      !taxiForm.phone.trim() ||
      !taxiForm.language ||
      taxiForm.serviceAreaIds.length === 0
    ) {
      toast.add("Complete all required driver fields.", "error");
      return;
    }

    setSubmittingTaxi(true);
    try {
      const response = await fetch("/api/v1/models/MCS_TaxiDriver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MCS_Vehicle: taxiForm.vehicle.trim(),
          MCS_VehicleType: taxiForm.vehicleType.trim(),
          MCS_BaseFare: Number(taxiForm.baseFare),
          C_Country_ID: Number(taxiForm.countryId),
          C_City_ID: Number(taxiForm.cityId),
          Phone: taxiForm.phone.trim(),
          MCS_ComplementoryFood: taxiForm.complementaryFood.trim(),
          AD_Language: taxiForm.language,
          MCS_ServiceAreas: taxiForm.serviceAreaIds.map(Number),
          serviceAreaNames: cities
            .filter((city) => taxiForm.serviceAreaIds.includes(city.id))
            .map((city) => city.name),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not register taxi driver");

      const driverId = String(
        result.id || result.MCS_TaxiDriver_ID || "registered",
      );
      localStorage.setItem("MCS_TaxiDriver_ID", driverId);
      try {
        const savedUser = JSON.parse(localStorage.getItem("mcs_user") || "{}");
        localStorage.setItem(
          "mcs_user",
          JSON.stringify({
            ...savedUser,
            linkedProfileIds: {
              ...savedUser.linkedProfileIds,
              MCS_TaxiDriver_ID: driverId,
            },
          }),
        );
        window.dispatchEvent(new Event("mcs_profile_change"));
      } catch {}

      toast.add("Taxi driver profile submitted for verification.", "success");
      await serviceCreated();
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not register taxi driver",
        "error",
      );
    } finally {
      setSubmittingTaxi(false);
    }
  }

  if (!isOpen) return null;

  if (serviceKind === "maid") {
    if (!user) {
      return (
        <Modal isOpen onClose={close} title="Maid Service" width={480}>
          <p className={styles.loading}>Loading service form...</p>
        </Modal>
      );
    }
    return (
      <BecomeMaidModal user={user} onClose={close} onCreated={serviceCreated} />
    );
  }

  if (serviceKind === "tiffin") {
    return (
      <BecomeTiffinProviderModal
        isOpen
        onClose={close}
        onCreated={serviceCreated}
      />
    );
  }

  if (serviceKind === "taxi") {
    return (
      <Modal isOpen onClose={close} title="Become a Taxi Driver" width={620}>
        <p className={styles.note}>
          Create your driver profile. It remains unverified until reviewed by
          MCS.
        </p>
        <div className={styles.formGrid}>
          <Field
            label="Vehicle"
            value={taxiForm.vehicle}
            placeholder="Toyota Camry 2024"
            onChange={(value) =>
              setTaxiForm((current) => ({ ...current, vehicle: value }))
            }
          />
          <Field
            label="Vehicle type"
            value={taxiForm.vehicleType}
            placeholder="Sedan"
            onChange={(value) =>
              setTaxiForm((current) => ({ ...current, vehicleType: value }))
            }
          />
          <Field
            label="Base fare"
            type="number"
            value={taxiForm.baseFare}
            placeholder="6"
            onChange={(value) =>
              setTaxiForm((current) => ({ ...current, baseFare: value }))
            }
          />
          <Field
            label="Phone"
            type="tel"
            value={taxiForm.phone}
            placeholder="+91 98765 43210"
            onChange={(value) =>
              setTaxiForm((current) => ({ ...current, phone: value }))
            }
          />
          <Field
            label="Country"
            value={taxiForm.countryId}
            placeholder="Select country"
            options={countries.map((country) => ({
              value: country.id,
              label: country.name,
            }))}
            onChange={(value) =>
              setTaxiForm((current) => ({
                ...current,
                countryId: value,
                cityId: "",
                serviceAreaIds: [],
              }))
            }
          />
          <Field
            label="City"
            value={taxiForm.cityId}
            placeholder={
              taxiForm.countryId ? "Select city" : "Select country first"
            }
            options={cities.map((city) => ({
              value: city.id,
              label: city.name,
            }))}
            onChange={(value) =>
              setTaxiForm((current) => ({ ...current, cityId: value }))
            }
          />
          <Field
            label="Language"
            value={taxiForm.language}
            placeholder="Select language"
            options={languages.map((language) => ({
              value: language.code,
              label: language.name,
            }))}
            onChange={(value) =>
              setTaxiForm((current) => ({ ...current, language: value }))
            }
          />
          <Field
            label="Complementary food"
            value={taxiForm.complementaryFood}
            placeholder="Water and snacks"
            onChange={(value) =>
              setTaxiForm((current) => ({
                ...current,
                complementaryFood: value,
              }))
            }
          />
        </div>
        <fieldset
          className={styles.serviceAreas}
          disabled={!taxiForm.countryId || cities.length === 0}
        >
          <legend>Service areas</legend>
          <div className={styles.serviceAreaOptions}>
            {cities.map((city) => (
              <label key={city.id} className={styles.serviceAreaOption}>
                <input
                  type="checkbox"
                  checked={taxiForm.serviceAreaIds.includes(city.id)}
                  onChange={(event) =>
                    setTaxiForm((current) => ({
                      ...current,
                      serviceAreaIds: event.target.checked
                        ? [...current.serviceAreaIds, city.id]
                        : current.serviceAreaIds.filter((id) => id !== city.id),
                    }))
                  }
                />
                <span>{city.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.actions}>
          <Btn kind="ghost" size="md" onClick={close}>
            Back
          </Btn>
          <Btn
            kind="primary"
            size="md"
            onClick={submitTaxi}
            disabled={submittingTaxi}
          >
            {submittingTaxi ? "Submitting..." : "Submit profile"}
          </Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={close}
      title={
        listingKind === "services"
          ? "Choose Service Type"
          : "What Do You Want to List?"
      }
      width={560}
    >
      {listingKind === "" ? (
        <div className={styles.choiceGrid}>
          <button
            type="button"
            className={styles.choice}
            onClick={chooseBusiness}
          >
            <strong>Business</strong>
            <span>List a company, shop, practice, or other business.</span>
          </button>
          <button
            type="button"
            className={styles.choice}
            onClick={() => setListingKind("services")}
          >
            <strong>Services</strong>
            <span>Offer maid, tiffin, or taxi services.</span>
          </button>
        </div>
      ) : (
        <>
          <div className={styles.choiceGrid}>
            <button
              type="button"
              className={styles.choice}
              onClick={() => setServiceKind("maid")}
            >
              <strong>Maid Service</strong>
              <span>Create maid service profile.</span>
            </button>
            <button
              type="button"
              className={styles.choice}
              onClick={() => setServiceKind("tiffin")}
            >
              <strong>Tiffin Service</strong>
              <span>Create cooking and delivery profile.</span>
            </button>
            <button
              type="button"
              className={styles.choice}
              onClick={() => setServiceKind("taxi")}
            >
              <strong>Taxi Service</strong>
              <span>Create taxi driver profile.</span>
            </button>
          </div>
          <div className={styles.actions}>
            <Btn kind="ghost" size="md" onClick={() => setListingKind("")}>
              Back
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}
