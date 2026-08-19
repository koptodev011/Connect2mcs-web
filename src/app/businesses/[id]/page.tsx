"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import Icon from "@/components/Icon";
import {
  Btn,
  Card,
  Rating,
  Tag,
  useGlobalToast,
} from "@/components/primitives";
import { Business } from "@/data/businesses";
import { ListBusinessModal } from "@/components/FormModals";
import { toneBg, toneColor } from "@/lib/tones";
import styles from "./page.module.css";

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useGlobalToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/data/businesses")
      .then((res) => res.json())
      .then((data: Business[]) => {
        const found = data.find((b) => b.id === id);
        if (found) setBusiness(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id, reloadKey]);

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

  async function deleteBusiness() {
    if (!business || deleting) return;
    if (!window.confirm(`Delete "${business.name}"? This cannot be undone.`))
      return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/v1/models/MCS_Businesses/${encodeURIComponent(business.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Could not delete business");

      toast.add("Business deleted successfully.", "success");
      router.push("/businesses");
      router.refresh();
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not delete business",
        "error",
      );
      setDeleting(false);
    }
  }
  if (loading) {
    return <div className={styles.loading}>Loading business details...</div>;
  }

  if (!business) return notFound();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/businesses" className={styles.backLink}>
          <Icon name="chevL" size={14} color={C.ink3} /> Back to Directory
        </Link>
        {currentUserId && business.ownerId === currentUserId && (
          <div className={styles.ownerActions}>
            <Btn kind="outline" size="md" onClick={() => setEditOpen(true)}>
              Edit Business
            </Btn>
            <Btn
              kind="ghost"
              size="md"
              onClick={deleteBusiness}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete Business"}
            </Btn>
          </div>
        )}
      </div>

      <Card pad={0} className={styles.card}>
        <div className={styles.hero} data-tone={business.tone}>
          <div className={styles.heroInner}>
            <div className={styles.businessInitial} data-tone={business.tone}>
              {business.name[0]}
            </div>
            <div className={styles.businessDetails}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{business.name}</h1>
                {business.verified && (
                  <Icon name="verify" size={24} color={C.green} />
                )}
              </div>
              <div className={styles.ownerRow}>
                {business.owner} ·{" "}
                <Rating
                  value={business.rating}
                  count={business.reviews}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.tags}>
            <Tag color={toneColor[business.tone]} bg={toneBg[business.tone]}>
              {business.cat}
            </Tag>
            <Tag color={C.ink2} bg={C.bgDeep}>
              <Icon name="pin" size={13} color={C.ink3} /> {business.city} ,{" "}
              {business.country}
            </Tag>
            {business.mandal && business.mandal !== "-" && (
              <Tag color={C.ink2} bg={C.bgDeep}>
                <Icon name="star" size={13} color={C.ink3} /> {business.mandal}
              </Tag>
            )}
          </div>

          <h3 className={styles.sectionTitle}>About</h3>
          <p className={styles.about}>{business.desc}</p>

          <h3 className={styles.sectionTitle}>Services</h3>
          <div className={styles.services}>
            {business.services.map((s) => (
              <Tag key={s} color={C.ink2} bg={C.bgDeep}>
                {s}
              </Tag>
            ))}
          </div>

          <div className={styles.actions}>
            {business.phone ? (
              <a href={`tel:${business.phone}`} className={styles.phoneLink}>
                <Btn kind="primary" size="lg" iconL="chat">
                  Call {business.phone}
                </Btn>
              </a>
            ) : (
              <Btn kind="primary" size="lg" iconL="chat">
                Contact Business
              </Btn>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.websiteLink}
              >
                <Btn kind="outline" size="lg">
                  <Icon name="globe" size={18} color={C.ink} /> Website
                </Btn>
              </a>
            )}
            <Btn kind="outline" size="lg">
              <Icon name="share" size={18} color={C.ink} />
            </Btn>
          </div>
        </div>
      </Card>
      <ListBusinessModal
        isOpen={editOpen}
        business={business}
        onClose={() => setEditOpen(false)}
        onSaved={() => setReloadKey((key) => key + 1)}
      />
    </div>
  );
}
