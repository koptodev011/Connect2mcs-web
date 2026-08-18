"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Btn, Tag, useGlobalToast } from "@/components/primitives";
import { TiffinSubscribeModal } from "@/components/FormModals";
import { tiffinProviders, type TiffinProvider } from "@/data/tiffin";
import styles from "./provider.module.css";

type ProviderReview = {
  id: string;
  userName: string;
  review: string;
  rating: number;
  date?: string;
};

export default function TiffinProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const staticProvider = tiffinProviders.find((item) => item.id === id);
  const [provider, setProvider] = useState<TiffinProvider | undefined>(
    staticProvider,
  );
  const [loading, setLoading] = useState(!staticProvider);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const toast = useGlobalToast();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/models/MCS_TiffinProvider?top=100&skip=0", {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load tiffin provider")),
      )
      .then((data: { records?: TiffinProvider[] }) => {
        const match = Array.isArray(data.records)
          ? data.records.find((item) => String(item.id) === id)
          : undefined;
        if (match) setProvider(match);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error(error);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const syncLogin = () => {
      try {
        const user = JSON.parse(localStorage.getItem("mcs_user") || "null");
        setLoggedIn(Boolean(Number(user?.id)) && !user?.isGuest);
      } catch {
        setLoggedIn(false);
      }
    };
    syncLogin();
    window.addEventListener("storage", syncLogin);
    window.addEventListener("mcs_profile_change", syncLogin);
    return () => {
      window.removeEventListener("storage", syncLogin);
      window.removeEventListener("mcs_profile_change", syncLogin);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      "/api/v1/models/MCS_TiffinProviderFeedback?providerId=" +
        encodeURIComponent(id),
      { signal: controller.signal },
    )
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load provider reviews")),
      )
      .then((data: { records?: ProviderReview[] }) => {
        setReviews(Array.isArray(data.records) ? data.records : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error(error);
      })
      .finally(() => setReviewsLoading(false));
    return () => controller.abort();
  }, [id]);

  const openProviderChat = () => {
    let user: { id?: string | number; isGuest?: boolean } | null = null;
    try {
      user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    } catch {}
    if (!Number(user?.id) || user?.isGuest) {
      router.push("/login");
      return;
    }
    if (!provider) return;
    router.push(
      "/chat?user=" +
        encodeURIComponent(provider.name) +
        "&source=tiffin&tiffinProviderId=" +
        encodeURIComponent(provider.id),
    );
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reviewRating < 1 || !reviewText.trim()) {
      toast.add("Select a rating and enter your review.", "error");
      return;
    }

    setReviewSaving(true);
    try {
      const response = await fetch(
        "/api/v1/models/MCS_TiffinProviderFeedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: Number(id),
            MCS_Review: reviewText.trim(),
            Rating: reviewRating,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not submit your review.");
      }
      if (result.review) {
        setReviews((current) => [result.review, ...current]);
      }
      setReviewRating(0);
      setReviewText("");
      toast.add("Your review was submitted successfully.", "success");
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not submit your review.",
        "error",
      );
    } finally {
      setReviewSaving(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.notFound}>
        <div className={styles.notFoundIcon}>
          <Icon name="tiffin" size={34} color="currentColor" />
        </div>
        <h1>Loading provider...</h1>
        <p>Getting the latest tiffin details.</p>
      </main>
    );
  }

  if (!provider) {
    return (
      <main className={styles.notFound}>
        <div className={styles.notFoundIcon}>
          <Icon name="tiffin" size={34} color="currentColor" />
        </div>
        <h1>Provider not found</h1>
        <p>This tiffin provider may no longer be available.</p>
        <Link href="/tiffin" className={styles.backLink}>
          <Icon name="chevL" size={16} />
          Back to tiffin services
        </Link>
      </main>
    );
  }

  const feedbackRatings = reviews
    .map((review) => Number(review.rating))
    .filter((rating) => rating >= 1 && rating <= 5);
  const feedbackAverage = feedbackRatings.length
    ? feedbackRatings.reduce((total, rating) => total + rating, 0) /
      feedbackRatings.length
    : 0;

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link
          href="/tiffin"
          className={styles.backButton}
          aria-label="Back to tiffin services"
        >
          <Icon name="chevL" size={20} />
        </Link>
        <div>
          <span>Tiffin Services</span>
          <Icon name="chevR" size={13} color="#9A8D80" />
          <strong>{provider.name}</strong>
        </div>
      </nav>

      <section
        className={[styles.hero, styles["tone_" + provider.tone]].join(" ")}
      >
        <div className={styles.heroGlow} />
        <div className={styles.identity}>
          <div className={styles.avatar}>
            <Icon name="tiffin" size={44} color="currentColor" />
          </div>
          <div>
            <div className={styles.eyebrow}>Community tiffin provider</div>
            <h1>{provider.name}</h1>
            <div className={styles.location}>
              <Icon name="pin" size={16} color="currentColor" />
              {provider.city} · {provider.mandal}
            </div>
            <Tag
              color={provider.veg ? "#13652D" : "#8E2719"}
              bg={provider.veg ? "#DDF2E3" : "#F9DCD4"}
              className={styles.foodTag}
            >
              {provider.veg ? "🟢 Veg" : "🔴 Non-veg"}
            </Tag>
          </div>
        </div>
        <div className={styles.trustPanel}>
          <div className={styles.rating}>
            <Icon name="star" size={20} color="#FFB224" />
            <strong>{feedbackAverage.toFixed(1)}</strong>
            <span>
              {"from " +
                feedbackRatings.length +
                " " +
                (feedbackRatings.length === 1 ? "review" : "reviews")}
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.verified}>
            <Icon name="verify" size={22} color="#49C887" />
            <div>
              <strong>Verified Cook</strong>
              <span>{provider.serviceDays} service days</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.content}>
          <section className={[styles.panel, styles.specialtyPanel].join(" ")}>
            <div className={styles.sectionEyebrow}>Specialty</div>
            <h2>{provider.specialty}</h2>
            <div className={styles.chips}>
              {provider.menu.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <div className={styles.sectionEyebrow}>Freshly prepared</div>
                <h2>Menu &amp; offerings</h2>
              </div>
              {provider.trial && (
                <span className={styles.trialBadge}>Trial box available</span>
              )}
            </div>
            <div className={styles.menuGrid}>
              {provider.menu.map((item, index) => (
                <div key={item} className={styles.menuItem}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
            <div className={styles.cookNote}>
              <Icon name="spark" size={18} color="#C65320" />
              <div>
                <strong>About</strong>
                <p>{provider.note}</p>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionEyebrow}>Service information</div>
            <h2>Details &amp; delivery</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detail}>
                <span>
                  <Icon name="pin" size={20} />
                </span>
                <div>
                  <small>Delivery areas</small>
                  <strong>{provider.delivery}</strong>
                </div>
              </div>
              <div className={styles.detail}>
                <span>
                  <Icon name="cal" size={20} />
                </span>
                <div>
                  <small>Serving days</small>
                  <strong>{provider.serviceDays} days</strong>
                </div>
              </div>
              <div className={styles.detail}>
                <span>
                  <Icon name="people" size={20} />
                </span>
                <div>
                  <small>Community</small>
                  <strong>{provider.mandal}</strong>
                </div>
              </div>
            </div>
          </section>

          {!provider.owned && (
            <section className={[styles.panel, styles.reviewsPanel].join(" ")}>
              <div className={styles.sectionHeading}>
                <div>
                  <div className={styles.sectionEyebrow}>
                    Community feedback
                  </div>
                  <h2>Reviews &amp; ratings</h2>
                </div>
                <span className={styles.reviewCount}>
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              {loggedIn ? (
                <form className={styles.reviewForm} onSubmit={submitReview}>
                  <div>
                    <strong>Rate this tiffin provider</strong>
                    <div
                      className={styles.starPicker}
                      role="radiogroup"
                      aria-label="Review rating"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          role="radio"
                          aria-checked={reviewRating === rating}
                          aria-label={
                            rating + " star" + (rating === 1 ? "" : "s")
                          }
                          className={
                            rating <= reviewRating ? styles.selectedStar : ""
                          }
                          onClick={() => setReviewRating(rating)}
                        >
                          {String.fromCharCode(9733)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    <span>Your review</span>
                    <textarea
                      required
                      rows={4}
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      placeholder="Share your experience with this provider..."
                    />
                  </label>
                  <button
                    type="submit"
                    className={styles.submitReview}
                    disabled={reviewSaving}
                  >
                    {reviewSaving ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              ) : (
                <div className={styles.reviewLogin}>
                  <p>Sign in to rate and review this tiffin provider.</p>
                  <Link href="/login">Sign in</Link>
                </div>
              )}

              <div className={styles.reviewList}>
                {reviewsLoading ? (
                  <div className={styles.reviewStatus}>Loading reviews...</div>
                ) : reviews.length ? (
                  reviews.map((review) => (
                    <article key={review.id}>
                      <div className={styles.reviewTop}>
                        <strong>{review.userName}</strong>
                        <span>
                          {String.fromCharCode(9733).repeat(review.rating)}
                        </span>
                      </div>
                      <p>{review.review}</p>
                      {review.date && (
                        <time dateTime={review.date}>
                          {new Date(review.date).toLocaleDateString()}
                        </time>
                      )}
                    </article>
                  ))
                ) : (
                  <div className={styles.reviewStatus}>
                    No reviews yet. Be the first to share your experience.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.priceCard}>
            <div className={styles.priceLabel}>Home-cooked meal plan</div>
            <div className={styles.price}>
              <strong>{provider.perMeal}</strong>
              <span>/ meal</span>
            </div>
            <div className={styles.monthly}>
              {provider.perMonth} monthly · {provider.serviceDays} days
            </div>
            <div className="mt-2"></div>
            <Btn
              kind="primary"
              size="lg"
              full
              iconL="chat"
              onClick={openProviderChat}
            >
              Chat with Cook
            </Btn>
            <p>
              No payment is taken until you confirm the plan with the provider.
            </p>
          </div>
        </aside>
      </div>
      <TiffinSubscribeModal
        isOpen={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        providerName={provider.name}
        basePrice={provider.perMeal}
      />
    </main>
  );
}
