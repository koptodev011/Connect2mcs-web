"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import { formatPrice } from "@/lib/currency";
import Icon from "@/components/Icon";
import { marketplaceChatHref } from "@/lib/marketplace-chat";
import { Btn, Card, ImgPh, Avatar, Tag, Modal, Field, useGlobalToast } from "@/components/primitives";
import type { MarketplaceListing } from "@/data/marketplace";
import styles from "./page.module.css";

type MarketplaceDetailListing = MarketplaceListing & {
  image?: string;
  desc?: string;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(
        result.includes(",") ? result.substring(result.indexOf(",") + 1) : result,
      );
    };
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

interface EditForm {
  title: string;
  price: string;
  qty: string;
  condition: string;
  adType: string;
  desc: string;
  status: string;
  soldDate: string;
  category: string;
  currencyId: string;
  countryId: string;
  cityId: string;
}

type OptionRecord = {
  id: string | number;
  Name?: string;
  identifier?: string;
  ISO_Code?: string;
  C_ISO_Code?: string;
  name?: string;
  code?: string;
  IsActive?: boolean;
};

const conditionStyle: Record<string, { bg: string; fg: string }> = {
  New: { bg: C.greenLt, fg: C.green },
  "Like new": { bg: C.saffronLt, fg: C.saffronDk },
  Good: { bg: C.bgDeep, fg: C.ink2 },
  Used: { bg: C.bgDeep, fg: C.ink3 },
};

export default function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceDetailListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    price: "",
    qty: "1",
    condition: "Good",
    adType: "Personal",
    desc: "",
    status: "PB",
    soldDate: "",
    category: "Electronics",
    currencyId: "",
    countryId: "",
    cityId: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<OptionRecord[]>([]);
  const [currencies, setCurrencies] = useState<OptionRecord[]>([]);
  const [countries, setCountries] = useState<OptionRecord[]>([]);
  const [cities, setCities] = useState<OptionRecord[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const toast = useGlobalToast();

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
  const isOwner = Boolean(
    listing &&
      currentUserId &&
      listing.ownerId &&
      String(listing.ownerId) === String(currentUserId),
  );

  const openChat = () => {
    if (!listing) return;
    const href = marketplaceChatHref({
      ownerId: listing.ownerId ? String(listing.ownerId) : "",
      sellerName: listing.seller,
      listingId: String(listing.id),
      listingTitle: listing.title,
      listingPrice: listing.price,
      listingLocation: listing.city,
    });
    const user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    if (!user || !Number(user?.id) || user?.isGuest) {
      localStorage.setItem("mcs_login_return", href);
      router.push("/login");
      return;
    }
    router.push(href);
  };

  useEffect(() => {
    fetch("/api/data/marketplace", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MarketplaceDetailListing[]) => {
        const found = Array.isArray(data)
          ? data.find((l) => l.id === id)
          : null;
        setListing(found ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    let userId = 0;
    try {
      userId =
        Number(JSON.parse(localStorage.getItem("mcs_user") || "{}").id) || 0;
    } catch {}
    if (userId) {
      fetch(`/api/marketplace/favorites?userId=${userId}`)
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) => {
          const favorite = (data.favorites || []).find(
            (item: { id: number; marketplaceId: number }) =>
              String(item.marketplaceId) === id,
          );
          setIsSaved(Boolean(favorite));
        })
        .catch(() => undefined);
    }
  }, [id]);

  const autoEditHandled = useRef(false);
  useEffect(() => {
    if (!listing || autoEditHandled.current) return;
    if (window.location.search.includes("edit=1")) {
      autoEditHandled.current = true;
      openEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing]);

  useEffect(() => {
    if (!editOpen) return;
    fetch("/api/v1/models/MCS_MarketPlace_Category", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { records?: OptionRecord[] }) =>
        setCategories(
          Array.isArray(data.records)
            ? data.records.filter(
                (c) => c.IsActive !== false && (c.Name || "").trim(),
              )
            : [],
        ),
      )
      .catch(() => setCategories([]));
    fetch("/api/v1/models/C_Currency", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { records?: OptionRecord[] }) =>
        setCurrencies(Array.isArray(data.records) ? data.records : []),
      )
      .catch(() => setCurrencies([]));
    fetch("/api/data/countries", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: OptionRecord[]) => setCountries(Array.isArray(data) ? data : []))
      .catch(() => setCountries([]));
  }, [editOpen]);

  useEffect(() => {
    if (!editForm.countryId) return;
    const controller = new AbortController();
    fetch(
      `/api/v1/models/C_City?countryId=${encodeURIComponent(editForm.countryId)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { records?: OptionRecord[] }) =>
        setCities(Array.isArray(data.records) ? data.records : []),
      )
      .catch(() => {
        if (!controller.signal.aborted) setCities([]);
      });
    return () => controller.abort();
  }, [editForm.countryId]);

  const toggleSave = async () => {
    if (!listing || savingFavorite) return;
    let userId = 0;
    try {
      userId =
        Number(JSON.parse(localStorage.getItem("mcs_user") || "{}").id) || 0;
    } catch {}
    const marketplaceId = Number(listing.id);
    if (!userId || !marketplaceId) return;

    const active = !isSaved;
    setIsSaved(active);
    setSavingFavorite(true);
    try {
      const response = await fetch(
        "/api/v1/models/MCS_Marketplace_Favorite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            AD_User_ID: userId,
            MCS_MarketPlaces_ID: marketplaceId,
            Name: listing.title,
            MCS_SavedDate: new Date().toISOString(),
            IsActive: active,
          }),
        },
      );
      if (!response.ok) throw new Error("Could not update favorite");
      await response.json();
    } catch {
      setIsSaved(!active);
    } finally {
      setSavingFavorite(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading item…</div>;
  }

  function openEdit() {
    if (!listing) return;
    setEditForm({
      title: listing.title,
      price: listing.price.replace(/[^0-9.]/g, ""),
      qty: listing.qty ? String(listing.qty) : "1",
      condition: listing.condition,
      adType: listing.adType || "Personal",
      desc: listing.desc || "",
      status: listing.status === "SD" ? "SD" : "PB",
      soldDate:
        listing.status === "SD"
          ? listing.soldDate
            ? new Date(listing.soldDate).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10)
          : "",
      category: listing.cat,
      currencyId: listing.currencyId ? String(listing.currencyId) : "",
      countryId: listing.countryId ? String(listing.countryId) : "",
      cityId: listing.cityId ? String(listing.cityId) : "",
    });
    setImageFile(null);
    setEditOpen(true);
  }

  const setE = (key: keyof EditForm) => (value: string) =>
    setEditForm((f) => ({ ...f, [key]: value }));

  const saveEdit = async () => {
    if (!listing || saving) return;
    if (!editForm.title.trim()) {
      toast.add("Title is required", "error");
      return;
    }
    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        toast.add("Please select a valid image file.", "error");
        return;
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        toast.add("Image size must be 5 MB or less.", "error");
        return;
      }
    }
    setSaving(true);
    try {
      const sold = editForm.status === "SD";
      const soldDate =
        sold && editForm.soldDate
          ? new Date(`${editForm.soldDate}T12:00:00`).toISOString()
          : new Date().toISOString();
      const logoData = imageFile ? await fileToBase64(imageFile) : "";
      const selectedCategory = categories.find(
        (c) => (c.Name || "").trim() === editForm.category,
      );
      const selectedCurrency = currencies.find(
        (c) => String(c.id) === editForm.currencyId,
      );
      const currencyIso = (
        selectedCurrency?.ISO_Code ||
        selectedCurrency?.C_ISO_Code ||
        selectedCurrency?.Name ||
        ""
      ).trim();
      const cityName =
        cities.find((c) => String(c.id) === editForm.cityId)?.name || "";
      const countryName =
        countries.find((c) => String(c.id) === editForm.countryId)?.name || "";
      const locationValue = [cityName, countryName].filter(Boolean).join(", ");

      const response = await fetch(
        `/api/v1/models/MCS_MarketPlaces/${listing.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Name: editForm.title,
            Price: editForm.price,
            qty: Number(editForm.qty) || 1,
            Description: editForm.desc,
            MCS_Condition: editForm.condition,
            MCS_AdType: editForm.adType,
            MCS_Status: editForm.status,
            ...(sold ? { MCS_SoldDate: soldDate } : {}),
            C_Currency_ID: { id: Number(editForm.currencyId) || 0 },
            C_Country_ID: { id: Number(editForm.countryId) || 0 },
            C_City_ID: { id: Number(editForm.cityId) || 0 },
            MCS_MarketPlace_Category_ID: selectedCategory
              ? { id: selectedCategory.id, identifier: editForm.category }
              : undefined,
            Location: locationValue,
            ...(logoData
              ? {
                  MCS_Logo_ID: {
                    data: logoData,
                    name: imageFile?.name || "Listing image",
                  },
                }
              : {}),
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update listing");
      const nextCurrency = currencyIso || listing.currency;
      setListing((prev) =>
        prev
          ? {
              ...prev,
              title: editForm.title,
              price: editForm.price
                ? formatPrice(editForm.price, nextCurrency)
                : prev.price,
              desc: editForm.desc,
              qty: Number(editForm.qty) || 1,
              condition: editForm.condition as MarketplaceListing["condition"],
              cat: editForm.category,
              city: locationValue || prev.city,
              currency: nextCurrency,
              currencyId: Number(editForm.currencyId) || null,
              cityId: Number(editForm.cityId) || null,
              countryId: Number(editForm.countryId) || null,
              image: logoData
                ? `data:image/svg+xml;base64,${logoData}`
                : prev.image,
              sold,
              status: editForm.status,
              soldDate: sold ? soldDate : "",
            }
          : prev,
      );
      toast.add("Listing updated");
      setEditOpen(false);
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not update listing",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!listing || deleting) return;
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/v1/models/MCS_MarketPlaces/${listing.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Could not delete listing");
      toast.add("Listing deleted");
      window.location.href = "/marketplace";
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not delete listing",
        "error",
      );
      setDeleting(false);
    }
  };

  if (!listing) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundTitle}>Item not found</div>
        <p className={styles.notFoundCopy}>
          This listing may have been sold or removed.
        </p>
        <Link href="/marketplace" className={styles.notFoundBtn}>
          <Btn kind="primary" size="md" iconL="chevL">
            Back to Marketplace
          </Btn>
        </Link>
      </div>
    );
  }

  const cs = conditionStyle[listing.condition] ?? { bg: C.bgDeep, fg: C.ink2 };

  return (
    <div className={styles.page}>
      <Link href="/marketplace" className={styles.backLink}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Marketplace
      </Link>

      <Card pad={0} className={styles.card}>
        <ImgPh
          kind={listing.kind}
          height={360}
          tone={listing.tone}
          src={listing.image}
        />
        <div className={styles.content}>
          <div className={styles.headingRow}>
            <div>
              <h1 className={styles.title}>{listing.title}</h1>
              <div className={styles.subtitle}>
                <Icon name="pin" size={16} color={C.ink3} /> {listing.city} ·
                Posted {listing.when}
              </div>
            </div>
            <div className={styles.rightCol}>
              <div className={styles.priceWrap}>
                <div className={`num ${styles.price}`}>{listing.price}</div>
              </div>
              {isOwner && (
                <div className={styles.headActions}>
                  <Btn kind="outline" size="md" onClick={openEdit}>
                    Edit
                  </Btn>
                  <Btn
                    kind="outline"
                    size="md"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ color: C.brick, borderColor: C.brick }}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </Btn>
                </div>
              )}
            </div>
          </div>

          <div className={styles.tags}>
            <Tag color={cs.fg} bg={cs.bg}>
              {listing.condition}
            </Tag>
            <Tag color={C.ink2} bg={C.bgDeep}>
              {listing.cat}
            </Tag>
            {listing.featured && (
              <Tag color={C.saffronDk} bg={C.saffronLt}>
                Featured
              </Tag>
            )}
          </div>

          <div className={styles.sellerRow}>
            <Avatar name={listing.seller} size={48} style={{ fontSize: 18 }} />
            <div>
              <div className={styles.sellerName}>{listing.seller}</div>
              <div className={styles.sellerMeta}>
                {listing.mandal} · Verified Member
              </div>
            </div>
          </div>

          <p className={styles.description}>
            {listing.desc
              ? listing.desc
              : `Selling my ${listing.title} in ${listing.condition.toLowerCase()} condition. Pickup from ${listing.city}.`}
          </p>

          <div className={styles.actions}>
            {!isOwner && (
              <Btn kind="primary" size="lg" iconL="chat" onClick={openChat}>
                Message Seller
              </Btn>
            )}
            <Btn
              kind="outline"
              size="lg"
              onClick={toggleSave}
              disabled={savingFavorite}
              aria-label={isSaved ? "Remove from saved" : "Save listing"}
            >
              <Icon name="heart" size={18} color={isSaved ? C.brick : C.ink} />
            </Btn>
            <Btn kind="outline" size="lg">
              <Icon name="share" size={18} color={C.ink} />
            </Btn>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit listing"
        width={520}
      >
        <Field
          label="Title *"
          value={editForm.title}
          onChange={setE("title")}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Price" value={editForm.price} onChange={setE("price")} placeholder="250" />
          <Field label="Quantity" type="number" value={editForm.qty} onChange={setE("qty")} placeholder="1" />
        </div>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Category</div>
          <select value={editForm.category} onChange={(e) => setE("category")(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none" }}>
            {(categories.length > 0
              ? categories.map((c) => (c.Name || "").trim()).filter(Boolean)
              : ["Electronics", "Furniture", "Books", "Vehicles", "Kitchen", "Clothing", "Kids & Toys", "Other"]
            ).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field
            label="Condition"
            value={editForm.condition}
            onChange={setE("condition")}
            options={["New", "Like new", "Good", "Used"].map((v) => ({
              value: v,
              label: v,
            }))}
          />
          <Field
            label="Ad type"
            value={editForm.adType}
            onChange={setE("adType")}
            options={[
              { value: "Personal", label: "Personal" },
              { value: "Business", label: "Business" },
            ]}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Country</div>
            <select
              value={editForm.countryId}
              onChange={(e) => {
                setE("countryId")(e.target.value);
                setE("cityId")("");
                setCities([]);
              }}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none" }}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{c.name || c.Name || c.identifier}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "block", marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>City</div>
            <select
              value={editForm.cityId}
              onChange={(e) => setE("cityId")(e.target.value)}
              disabled={!editForm.countryId}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none" }}
            >
              <option value="">{editForm.countryId ? "Select city" : "Select country first"}</option>
              {cities.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{c.name || c.Name}</option>
              ))}
            </select>
          </label>
        </div>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Currency</div>
          <select
            value={editForm.currencyId}
            onChange={(e) => setE("currencyId")(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none" }}
          >
            <option value="">Keep current</option>
            {currencies.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>{c.ISO_Code || c.C_ISO_Code || c.Name || c.identifier || c.id}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Photo (optional)</div>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ fontSize: 13, color: C.ink2, width: "100%" }} />
          {imageFile && (
            <small style={{ display: "block", marginTop: 4, color: C.ink3, fontSize: 11.5 }}>
              {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
            </small>
          )}
        </label>
        <Field
          label="Status"
          value={editForm.status}
          onChange={(v) => {
            setE("status")(v);
            if (v === "SD" && !editForm.soldDate) {
              setE("soldDate")(new Date().toISOString().slice(0, 10));
            }
          }}
          options={[
            { value: "PB", label: "Published" },
            { value: "SD", label: "Sold" },
          ]}
        />
        {editForm.status === "SD" && (
          <Field
            label="Sold date"
            type="date"
            value={editForm.soldDate}
            onChange={setE("soldDate")}
          />
        )}
        <Field
          label="Description"
          value={editForm.desc}
          onChange={setE("desc")}
          multiline
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn kind="primary" size="md" full onClick={saveEdit} disabled={saving}>
            {saving ? "Saving…" : "Update listing"}
          </Btn>
          <Btn kind="ghost" size="md" onClick={() => setEditOpen(false)}>
            Cancel
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
