"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { Avatar, useGlobalToast } from "@/components/primitives";
import { helpers } from "@/data/maids";
import styles from "../maids.module.css";

type Helper = (typeof helpers)[number] & { phone?: string };

type ReviewableBooking = {
  id: string;
  status: "A";
  rating: number;
  review: string;
};
type RawMaidProfile = Partial<Helper> & {
  MCS_Services?: string | { identifier?: string };
  MCS_ExperienceYears?: number | string;
  Address?: string;
  MCS_About?: string;
};

function getReferenceText(value: RawMaidProfile["MCS_Services"]) {
  return typeof value === "object" && value !== null
    ? value.identifier || ""
    : String(value || "");
}

function normalizeMaidProfile(data: RawMaidProfile, fallback: Helper): Helper {
  const services = getReferenceText(data.MCS_Services).replace(
    /\u00c2\u00b7/g,
    "\u00b7",
  );
  const experienceYears = Number(data.MCS_ExperienceYears);

  return {
    ...fallback,
    ...data,
    services: services || data.services || fallback.services,
    tag: data.tag || fallback.tag || "",
    experience: Number.isFinite(experienceYears)
      ? `${experienceYears} yrs exp`
      : data.experience || fallback.experience,
    location: data.Address?.trim() || data.location || fallback.location,
    about: data.MCS_About?.trim() || data.about || fallback.about,
    languages: Array.isArray(data.languages)
      ? data.languages
      : fallback.languages,
    skills: Array.isArray(data.skills) ? data.skills : fallback.skills,
    reviews: (Array.isArray(data.reviews) ? data.reviews : fallback.reviews).map(
      (review) => ({
        ...review,
        date: "date" in review ? String(review.date || "") : "",
      }),
    ),
  };
}

export default function MaidDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const fallback = helpers.find((helper) => helper.id === id) || helpers[0];
  const [helper, setHelper] = useState<Helper>(fallback);
  const [saved, setSaved] = useState(false);
  const [booking, setBooking] = useState(false);
  const [isOwnMaidProfile, setIsOwnMaidProfile] = useState(false);
  const [reviewableBooking, setReviewableBooking] =
    useState<ReviewableBooking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const toast = useGlobalToast();
  const router = useRouter();

  useEffect(() => {
    const syncOwnership = () => {
      try {
        const user = JSON.parse(localStorage.getItem("mcs_user") || "null") as {
          id?: number | string;
          isGuest?: boolean;
          linkedProfileIds?: Record<string, string | number>;
        } | null;
        const storedMaidId = String(localStorage.getItem("MCS_Maid_ID") || "");
        const linkedMaidId = String(user?.linkedProfileIds?.MCS_Maid_ID || "");
        const isLoggedIn = Boolean(Number(user?.id)) && !user?.isGuest;
        setIsOwnMaidProfile(
          Boolean(
            isLoggedIn &&
            storedMaidId === String(id) &&
            (linkedMaidId === String(id) ||
              storedMaidId === String(user?.id || "")),
          ),
        );
      } catch {
        setIsOwnMaidProfile(false);
      }
    };
    const frame = requestAnimationFrame(syncOwnership);
    window.addEventListener("storage", syncOwnership);
    window.addEventListener("mcs_profile_change", syncOwnership);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncOwnership);
      window.removeEventListener("mcs_profile_change", syncOwnership);
    };
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/data/maids?id=${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load profile")),
      )
      .then((data: RawMaidProfile & { error?: string }) => {
        if (data && !data.error && data.id) {
          setHelper(normalizeMaidProfile(data, fallback));
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          console.error("Maid details API error:", error);
      });
    return () => controller.abort();
  }, [fallback, id]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/models/MCS_Maid_Booking?maidId=${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { booking: null }))
      .then((data) => {
        const booking = data.booking as ReviewableBooking | null;
        if (!booking) return;
        setReviewableBooking(booking);
        setReviewRating(Number(booking.rating || 0));
        setReviewText(String(booking.review || ""));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Maid review eligibility error:", error);
        }
      });
    return () => controller.abort();
  }, [id]);
  const reviewCount =
    helper.reviews.length || Number(helper.jobs.match(/\d+/)?.[0] || 0);
  const hasExistingReview = Boolean(
    reviewableBooking &&
    (reviewableBooking.rating > 0 || reviewableBooking.review.trim()),
  );
  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewableBooking || reviewRating < 1 || !reviewText.trim()) {
      toast.add("Select a rating and enter your review.", "error");
      return;
    }
    setReviewSaving(true);
    try {
      const response = await fetch(
        `/api/v1/models/MCS_Maid_Booking/${reviewableBooking.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            MCS_Maid_ID: { id: Number(id) },
            MCS_Rating: reviewRating,
            MCS_Review: reviewText.trim(),
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not save your review.");
      }
      setReviewableBooking((current) =>
        current
          ? {
              ...current,
              rating: reviewRating,
              review: reviewText.trim(),
            }
          : current,
      );
      toast.add("Your rating and review were saved.", "success");
    } catch (error) {
      toast.add(
        error instanceof Error ? error.message : "Could not save your review.",
        "error",
      );
    } finally {
      setReviewSaving(false);
    }
  };
  const requestBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bookingForm = event.currentTarget;
    let user: {
      id?: number | string;
      name?: string;
      isGuest?: boolean;
    } | null = null;
    try {
      user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    } catch {}
    if (!user || !Number(user.id) || user.isGuest) {
      router.push("/login");
      return;
    }

    const form = new FormData(bookingForm);
    const services = form
      .getAll("services")
      .map(String)
      .map((service) => service.trim())
      .filter(Boolean);
    if (!services.length) {
      toast.add("Select at least one service.", "error");
      return;
    }

    setBooking(true);
    try {
      const response = await fetch("/api/v1/models/MCS_Maid_Booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MCS_Maid_ID: { id: Number(id) },
          AD_User_ID: { id: Number(user.id) },
          Name: String(user.name || "Community Member"),
          Address: String(form.get("Address") || "").trim(),
          notes: String(form.get("notes") || "").trim(),
          services: services.join(","),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not send booking request.");
      }
      toast.add(`Booking request sent to ${helper.name}`, "success");
      bookingForm.reset();
    } catch (error) {
      toast.add(
        error instanceof Error
          ? error.message
          : "Could not send booking request.",
        "error",
      );
    } finally {
      setBooking(false);
    }
  };
  const openChat = () => {
    let user: { id?: number | string; isGuest?: boolean } | null = null;
    try {
      user = JSON.parse(localStorage.getItem("mcs_user") || "null");
    } catch {}
    if (!Number(user?.id) || user?.isGuest) {
      router.push("/login");
      return;
    }
    router.push(
      `/chat?user=${encodeURIComponent(helper.name)}&source=maid&maidId=${encodeURIComponent(id)}`,
    );
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileNav}>
        <Link href="/maids">
          <Icon name="chevL" size={17} /> <span>Maid Profile</span>
        </Link>
      </div>

      <section className={styles.profileHero}>
        <div className={styles.profileAvatar}>
          <Avatar name={helper.name} size={82} />
          {helper.verified && (
            <i>
              <Icon name="verify" size={16} color="#3b9b6f" />
            </i>
          )}
        </div>
        <h1>{helper.name}</h1>
        {/* <p>
          {helper.services}
          {helper.tag ? ` · ${helper.tag}` : ""}
        </p> */}
        <small>
          <Icon name="pin" size={12} /> {helper.location}
        </small>
        {/* <div className={styles.verificationTags}>
          {helper.verified && <span>ID Verified</span>}
          {helper.verified && <span>Police Verified</span>}
          {helper.tag && <b>{helper.tag}</b>}
        </div> */}
      </section>

      <div
        className={`${styles.profileLayout} ${isOwnMaidProfile ? styles.ownProfileLayout : ""}`}
      >
        <main className={styles.profileMain}>
          <section className={styles.stats}>
            <div>
              <strong>{helper.rating || "New"}</strong>
              <small>Rating</small>
            </div>
            <div>
              <strong>{helper.jobs.match(/\d+/)?.[0] || 0}</strong>
              <small>Jobs Done</small>
            </div>
            <div>
              <strong>{helper.experience.match(/\d+/)?.[0] || "—"} yrs</strong>
              <small>Experience</small>
            </div>
            <div>
              <strong>{helper.languages.length}</strong>
              <small>Languages</small>
            </div>
          </section>

          <section className={styles.package}>
            <small>Monthly Package</small>
            <h2>
              {helper.price.split("/")[0]} <span>/ month</span>
            </h2>
            <div>
              <span>
                <Icon name="phone" size={13} color="#fff" />{" "}
                {helper.phone || "Phone on request"}
              </span>
            </div>
          </section>

          <section className={styles.contentCard}>
            <h2>About</h2>
            <p>
              {helper.about ||
                `${helper.name} is an experienced community helper offering dependable household support. Contact her to discuss your requirements and references.`}
            </p>
          </section>
          <section className={styles.contentCard}>
            <h2>Services &amp; Skills</h2>
            <div className={styles.skillTags}>
              {helper.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>
          <section className={styles.contentCard}>
            <h2>Languages</h2>
            <div className={styles.skillTags}>
              {helper.languages.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>

          {!isOwnMaidProfile && reviewableBooking && (
            <section className={styles.maidReviewFormCard}>
              <h2>Rate &amp; Review {helper.name.split(" ")[0]}</h2>
              <p>Your booking was accepted. Share your experience.</p>
              <form onSubmit={submitReview}>
                <div
                  className={styles.maidReviewStars}
                  role="radiogroup"
                  aria-label="Maid rating"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      role="radio"
                      aria-checked={reviewRating === rating}
                      aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                      className={
                        rating <= reviewRating ? styles.selectedStar : ""
                      }
                      onClick={() => setReviewRating(rating)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Write your review..."
                  required
                />
                <button type="submit" disabled={reviewSaving}>
                  {reviewSaving
                    ? "Saving..."
                    : hasExistingReview
                      ? "Update Rating & Review"
                      : "Submit Rating & Review"}
                </button>
              </form>
            </section>
          )}
          <section className={styles.reviews}>
            <div className={styles.reviewsTitle}>
              <h2>Reviews ({reviewCount})</h2>
              <span>
                ★★★★★ <b>{helper.rating}</b>
              </span>
            </div>
            {helper.reviews.length ? (
              helper.reviews.map((review, index) => (
                <article key={`${review.name}-${index}`}>
                  <div>
                    <strong>{review.name}</strong>
                    <span>{"★".repeat(review.rating)}</span>
                  </div>
                  <p>{review.text}</p>
                  {"date" in review && review.date && (
                    <small>{review.date}</small>
                  )}
                </article>
              ))
            ) : (
              <article>
                <p>
                  No written reviews yet. Be the first to book and share your
                  experience.
                </p>
              </article>
            )}
          </section>
        </main>

        {!isOwnMaidProfile && (
          <form
            id="maid-booking-form"
            className={styles.bookingPanel}
            onSubmit={requestBooking}
          >
            <h2>Book {helper.name.split(" ")[0]}</h2>
            <p>
              Share your requirements and the MCS team will confirm
              availability.
            </p>
            <fieldset className={styles.serviceMultiSelect}>
              <legend>Services</legend>
              <div>
                {helper.skills.map((skill, index) => (
                  <label key={skill}>
                    <input
                      type="checkbox"
                      name="services"
                      value={skill}
                      defaultChecked={index === 0}
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label>
              Home address
              <input
                name="Address"
                placeholder="Flat, building, area, city"
                required
              />
            </label>
            <label>
              Additional notes
              <textarea name="notes" placeholder="Any specific requirements" />
            </label>

            <button type="submit" disabled={booking}>
              {booking ? "Sending..." : "Send Booking Request"}{" "}
              <Icon name="arrow" size={15} color="#fff" />
            </button>
            <button
              type="button"
              className={styles.desktopChatButton}
              onClick={openChat}
            >
              <Icon name="chat" size={16} /> Chat
            </button>
          </form>
        )}
      </div>

      {!isOwnMaidProfile && (
        <div className={styles.mobileActions}>
          <button className={styles.chatButton} onClick={openChat}>
            <Icon name="chat" size={16} /> Chat
          </button>
          <button type="submit" form="maid-booking-form" disabled={booking}>
            {booking ? "Sending..." : "Book This Helper"}{" "}
            <Icon name="arrow" size={15} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
