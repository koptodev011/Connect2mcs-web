"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import Icon from "@/components/Icon";
import {
  Btn,
  Card,
  ImgPh,
  Rating,
  Avatar,
  useGlobalToast,
} from "@/components/primitives";
import { Mandal } from "@/data/mandals";
import { CalendarEvent } from "@/data/events";
import { ContactModal, BookModal } from "@/components/FormModals";
import { OrnamentDivider } from "@/components/Ornament";
import { toneColor } from "@/lib/tones";
import styles from "./page.module.css";

interface CommitteeMember {
  name: string;
  role: string;
  email: string;
  avatar: string;
  phone?: string;
}

interface SocialMedia {
  id: string;
  name: string;
  url: string;
  type: string;
  mandalId: string;
}

export default function MandalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mandal, setMandal] = useState<Mandal | null>(null);
  const [socials, setSocials] = useState<SocialMedia[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [gallery, setGallery] = useState<
    { img: string; title: string; desc: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [joinInitialValues, setJoinInitialValues] = useState<
    Record<string, string>
  >({});
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [visibleEventCount, setVisibleEventCount] = useState(6);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const toast = useGlobalToast();
  const router = useRouter();

  const handleJoinMandal = async () => {
    if (joined) {
      setJoined(false);
      return;
    }

    try {
      const savedUser = localStorage.getItem("mcs_user");
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (!user || user.isGuest) {
        router.push("/login");
        return;
      }

      let profile = user;
      if (user.name) {
        const response = await fetch(
          `/api/data/profile?username=${encodeURIComponent(user.name)}`,
        );
        const profiles = response.ok ? await response.json() : [];
        if (Array.isArray(profiles) && profiles[0])
          profile = { ...user, ...profiles[0] };
      }

      setJoinInitialValues({
        name: String(profile.name || profile.Name || user.name || ""),
        email: String(profile.email || profile.EMail || user.email || ""),
        phone: String(
          profile.phone || profile.Phone || profile.Phone2 || user.phone || "",
        ),
        note: "",
      });
      setJoinOpen(true);
    } catch {
      router.push("/login");
    }
  };

  const submitJoinRequest = async (form: Record<string, string>) => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      throw new Error("Name, email, and contact number are required");
    }
    if (!mandal?.id) throw new Error("Mandal details are unavailable");

    const response = await fetch("/api/mandal-membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mandalId: mandal.id, ...form }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.error || "Could not send membership request");
    setJoined(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: mandal?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.add("Link copied to clipboard!", "success");
    }
  };

  const toggleRsvp = (eventId: string) => {
    setRsvps((s) => {
      const n = new Set(s);
      if (n.has(eventId)) {
        n.delete(eventId);
        toast.add("RSVP cancelled", "info");
      } else {
        n.add(eventId);
        toast.add("RSVP confirmed! Add to calendar.", "success");
      }
      return n;
    });
  };

  useEffect(() => {
    fetch("/api/data/mandals")
      .then((res) => res.json())
      .then(async (mandalsData: Mandal[]) => {
        const found = mandalsData.find((m) => m.code === id) as
          | (Mandal & { id?: string })
          | undefined;
        if (found && found.id) {
          const detailRes = await fetch(`/api/data/mandals?id=${found.id}`);
          const parsedDetails = await detailRes.json();

          setMandal(parsedDetails.mandal || found);
          setSocials(parsedDetails.socials || []);

          if (
            Array.isArray(parsedDetails.committee) &&
            parsedDetails.committee.length > 0
          ) {
            setCommittee(parsedDetails.committee);
          }
          // else {
          //   setCommittee([
          //     { name: 'Dr. Ramesh Deshpande', role: 'President', email: `president@${found.code.toLowerCase()}.org`, avatar: 'RD' },
          //     { name: 'Sunita Kulkarni', role: 'Secretary', email: `secretary@${found.code.toLowerCase()}.org`, avatar: 'SK' },
          //     { name: 'Rahul Joshi', role: 'Treasurer', email: `treasurer@${found.code.toLowerCase()}.org`, avatar: 'RJ' },
          //     { name: 'Priya Joshi-Patil', role: 'Cultural Coordinator', email: `cultural@${found.code.toLowerCase()}.org`, avatar: 'PJP' },
          //   ]);
          // }

          if (Array.isArray(parsedDetails.gallery)) {
            setGallery(parsedDetails.gallery);
          }

          if (
            Array.isArray(parsedDetails.events) &&
            parsedDetails.events.length > 0
          ) {
            setEvents(parsedDetails.events);
          } else {
            const eventsRes = await fetch("/api/data/events")
              .then((res) => res.json())
              .catch(() => []);
            if (Array.isArray(eventsRes)) {
              const filtered = eventsRes.filter((e: CalendarEvent) => {
                const cityMatch =
                  e.where &&
                  found.city &&
                  e.where
                    .toLowerCase()
                    .includes(found.city.toLowerCase().split(",")[0].trim());
                const orgMatch =
                  e.organizer &&
                  (e.organizer
                    .toLowerCase()
                    .includes(found.code.toLowerCase()) ||
                    e.organizer
                      .toLowerCase()
                      .includes(found.name.toLowerCase()));
                const titleMatch =
                  e.title &&
                  (e.title.toLowerCase().includes(found.code.toLowerCase()) ||
                    e.title.toLowerCase().includes(found.name.toLowerCase()));
                return cityMatch || orgMatch || titleMatch;
              });
              setEvents(filtered.length > 0 ? filtered : eventsRes.slice(0, 2));
            }
          }
        } else {
          setMandal(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const visibleEvents = events.slice(0, visibleEventCount);
  const hasMoreEvents = visibleEventCount < events.length;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMoreEvents) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setVisibleEventCount((count) => Math.min(count + 6, events.length));
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [events.length, hasMoreEvents]);
  if (loading) {
    return <div className={styles.inline1}>Loading mandal details...</div>;
  }

  if (!mandal) return notFound();

  const primaryColor = toneColor[mandal.tone] || C.saffronDk;

  return (
    <div className={styles.inline2} data-tone={mandal.tone}>
      {/* 1. Header Card (Hero) */}
      <Card pad={0} className={styles.inline4}>
        <div className={styles.heroMedia}>
          <ImgPh
            kind="mandal"
            height={360}
            tone={mandal.tone}
            badge={mandal.hosting ? "Hosting an event soon" : undefined}
            src={mandal.image}
          />
          <Link
            href="/mandals"
            className={styles.heroControl}
            aria-label="Back to Mandals"
          >
            <Icon name="chevL" size={24} color="#fff" />
          </Link>
          <button
            className={[styles.heroControl, styles.shareControl].join(" ")}
            onClick={handleShare}
            aria-label="Share Mandal"
          >
            <Icon name="share" size={23} color="#fff" />
          </button>
        </div>
        <div className={styles.inline5}>
          <div className={styles.profileLogo}>
            <ImgPh
              kind="mandal"
              height={150}
              tone={mandal.tone}
              src={mandal.image}
            />
          </div>
          <div className={styles.inline6}>
            <div>
              <h1 className={styles.inline7}>{mandal.name}</h1>
              <div className={styles.inline8}>
                <Icon name="pin" size={16} color={C.ink3} />
                <span>
                  {mandal.city}, {mandal.region || mandal.country}
                </span>
                <span className={styles.inline9}>•</span>
                <span>Established in {mandal.est}</span>
              </div>
            </div>
            {mandal.rating > 0 && <Rating value={mandal.rating} size="lg" />}
          </div>

          <div className={[styles.inline10, "mob-stack"].join(" ")}>
            <div>
              <div className={[styles.inline11, "num"].join(" ")}>
                {mandal.members.toLocaleString()}
              </div>
              <div className={styles.inline12}>Active Members</div>
            </div>
            <div>
              <div className={[styles.inline13, "num"].join(" ")}>
                {mandal.events}
              </div>
              <div className={styles.inline14}>Events this year</div>
            </div>
          </div>
        </div>
      </Card>

      <nav className={styles.sectionTabs} aria-label="Mandal sections">
        {[
          ["about", "About"],
          ["committee", "Committee"],
          ["gallery", "Gallery"],
          ["events", "Events"],
        ].map(([sectionId, label]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            className={
              activeSection === sectionId ? styles.activeTab : undefined
            }
            aria-current={activeSection === sectionId ? "page" : undefined}
            onClick={() => setActiveSection(sectionId)}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* 2. About Section */}
      <section id="about">
        <OrnamentDivider label="About" marathi="माहिती" align="left" />
        <Card className={styles.inline15}>
          <div className={[styles.inline16, "mob-stack"].join(" ")}>
            {/* Left Col: Info */}
            <div>
              <h3 className={styles.inline17}>Our Mission & History</h3>
              <p className={styles.inline18}>
                {mandal.about ||
                  `Welcome to ${mandal.name}. We are dedicated to preserving and promoting Marathi culture, language, and traditions in ${mandal.city}. Join our vibrant community to celebrate festivals, network with professionals, and participate in cultural events.`}
              </p>

              {mandal.address && (
                <div className={styles.inline19}>
                  <div className={styles.inline20}>
                    <Icon name="map" size={16} color={primaryColor} /> Address /
                    पत्ता
                  </div>
                  <div>{mandal.address}</div>
                  {mandal.postal && (
                    <div className={styles.inline21}>
                      Postal Code: {mandal.postal}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: CTA and Socials */}
            <div className={[styles.inline22, "mob-pad-sm"].join(" ")}>
              <div>
                <h3 className={styles.inline23}>Interact with Us</h3>
                <div className={styles.inline24}>
                  <Btn
                    kind={joined ? "soft" : "primary"}
                    size="lg"
                    full
                    iconL={joined ? "check" : "plus"}
                    onClick={handleJoinMandal}
                    className={styles.inline25}
                  >
                    {joined ? "Membership pending" : "Join Mandal"}
                  </Btn>
                  {/* <Btn kind="outline" size="lg" full onClick={() => setContactOpen(true)}>Contact Committee</Btn> */}
                  {mandal.phone && (
                    <Btn
                      kind="outline"
                      size="lg"
                      full
                      onClick={() =>
                        window.open(`tel:${mandal.phone}`, "_self")
                      }
                      className={styles.inline26}
                    >
                      <Icon name="phone" size={18} color={primaryColor} />
                      Call {mandal.phone}
                    </Btn>
                  )}
                  {mandal.whatsapp && (
                    <Btn
                      kind="outline"
                      size="lg"
                      full
                      onClick={() =>
                        window.open(
                          `https://wa.me/${mandal.whatsapp}`,
                          "_blank",
                        )
                      }
                      className={styles.inline27}
                    >
                      <Icon name="whatsapp" size={18} color={primaryColor} />
                      WhatsApp {mandal.whatsapp}
                    </Btn>
                  )}
                  <Btn kind="ghost" size="lg" full onClick={handleShare}>
                    <Icon name="share" size={18} color={C.ink} /> Share Mandal
                  </Btn>
                  {mandal.email && (
                    <a
                      href={`mailto:${mandal.email}`}
                      className={[styles.inline28, "btn-int"].join(" ")}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.inline29}
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      {mandal.email}
                    </a>
                  )}
                </div>
              </div>

              {socials.length > 0 && (
                <div>
                  <h4 className={styles.inline30}>Official Channels</h4>
                  <div className={styles.inline31}>
                    {socials.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.inline32}
                      >
                        <Icon name="link" size={13} color={primaryColor} />
                        {s.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Committee Section */}
      {committee.length > 0 && (
        <section id="committee">
          <OrnamentDivider
            label="Committee"
            marathi="कार्यकारिणी"
            align="left"
          />
          <div className={styles.inline33}>
            {committee.map((member, idx) => (
              <Card key={idx} className={styles.inline34} pad={20}>
                <div className={styles.inline35}>
                  <Avatar name={member.name} size={64} />
                </div>
                <h4 className={styles.inline36}>{member.name}</h4>
                <div className={styles.inline37}>{member.role}</div>
                <div className={styles.inline38}>
                  {/* 1. Call Button */}
                  <a
                    href={`tel:${member.phone || "15550192834"}`}
                    title="Call"
                    className={[styles.inline39, "btn-int"].join(" ")}
                    onClick={(ev) => {
                      if (!member.phone) {
                        ev.preventDefault();
                        toast.add(`Calling: +1 (555) 019-2834`, "info");
                      }
                    }}
                  >
                    <Icon name="phone" size={16} color={C.ink2} />
                  </a>

                  {/* 2. More Option Button */}
                  <button
                    title="More options"
                    className={[styles.inline40, "btn-int"].join(" ")}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${member.name}\n${member.role}\nEmail: ${member.email}`,
                      );
                      toast.add("Contact info copied to clipboard!", "success");
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1.5"></circle>
                      <circle cx="19" cy="12" r="1.5"></circle>
                      <circle cx="5" cy="12" r="1.5"></circle>
                    </svg>
                  </button>

                  {/* 3. Mail Button */}
                  <a
                    href={`mailto:${member.email}`}
                    title="Email"
                    className={[styles.inline41, "btn-int"].join(" ")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery">
          <OrnamentDivider label="Gallery" marathi="चित्रदालन" align="left" />
          <div className={[styles.inline42, "mob-stack"].join(" ")}>
            {gallery.map((item, idx) => (
              <div
                key={idx}
                className={[styles.inline43, "gallery-item-hover"].join(" ")}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className={styles.inline44}
                />
                <div className={styles.inline45}>
                  <h5 className={styles.inline46}>{item.title}</h5>
                  <p className={styles.inline47}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Events Section */}
      <section id="events">
        <OrnamentDivider
          label="Events"
          marathi="आगामी कार्यक्रम"
          align="left"
        />
        {events.length === 0 ? (
          <Card className={styles.inline48}>
            <Icon name="cal" size={32} color={C.ink4} />
            <div className={styles.inline49}>
              No upcoming events scheduled at this moment.
            </div>
          </Card>
        ) : (
          <div className={[styles.inline50, "mob-stack"].join(" ")}>
            {visibleEvents.map((e, idx) => {
              const isGoing = rsvps.has(e.id || idx.toString());
              return (
                <Card key={e.id || idx} pad={0} className={styles.inline51}>
                  <div className={styles.inline52}>
                    {e.image ? (
                      <img
                        src={e.image}
                        alt={e.title}
                        className={styles.inline53}
                      />
                    ) : (
                      <ImgPh kind="event" height={160} tone={e.tone} />
                    )}
                    <div className={styles.inline54}>
                      <div className={styles.inline55}>{e.month}</div>
                      <div className={[styles.inline56, "num"].join(" ")}>
                        {e.day}
                      </div>
                    </div>
                  </div>
                  <div className={styles.inline57}>
                    <div className={styles.inline58}>{e.cat}</div>
                    <h4 className={styles.inline59}>{e.title}</h4>
                    {e.fullDate && (
                      <div className={styles.inline60}>{e.fullDate}</div>
                    )}
                    {e.desc && <div className={styles.inline61}>{e.desc}</div>}

                    <div className={styles.inline62}>
                      <div className={styles.inline63}>
                        <Icon name="pin" size={13} color={C.ink3} />
                        <span className={styles.inline64}>{e.where}</span>
                      </div>

                      <div className={styles.inline65}>
                        <div className={styles.inline66}>
                          <span className={styles.inline67}>
                            {e.going ? `+${e.going} going` : "Upcoming"}
                          </span>
                        </div>
                        {e.link ? (
                          <Btn
                            kind="soft"
                            size="sm"
                            onClick={() => window.open(e.link, "_blank")}
                          >
                            Register ↗
                          </Btn>
                        ) : (
                          <Btn
                            kind={isGoing ? "primary" : "soft"}
                            size="sm"
                            onClick={() => toggleRsvp(e.id || idx.toString())}
                            className={styles.inline68}
                          >
                            {isGoing ? "Going ✓" : "RSVP"}
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {hasMoreEvents && (
        <div
          ref={loadMoreRef}
          className={styles.loadMoreSentinel}
          aria-hidden="true"
        />
      )}

      {/* Modals */}
      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        title={`Contact ${mandal.name}`}
        subtitle="Direct message to the committee"
      />
      {joinOpen && (
        <BookModal
          isOpen={joinOpen}
          onClose={() => setJoinOpen(false)}
          title={`Join ${mandal.name}`}
          marathi="सामील व्हा"
          submitLabel="Submit membership request"
          initialValues={joinInitialValues}
          onSubmit={submitJoinRequest}
          fields={[
            { key: "name", label: "Name", placeholder: "Your name" },
            {
              key: "email",
              label: "Email",
              placeholder: "you@example.com",
              type: "email",
            },
            {
              key: "phone",
              label: "Contact number",
              placeholder: "Your contact number",
              type: "tel",
            },
            {
              key: "note",
              label: "Why do you want to join?",
              placeholder: "Optional note...",
              multiline: true,
            },
          ]}
        />
      )}
    </div>
  );
}
