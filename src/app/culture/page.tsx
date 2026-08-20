"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import Icon from "@/components/Icon";
import {
  Btn,
  Card,
  Tag,
  ImgPh,
  SectionHead,
  PageHeader,
  useGlobalToast,
} from "@/components/primitives";
import Link from "next/link";
import { festivalDays, todayDateLine } from "@/data/culture";
import type { MarathiMonth } from "@/data/culture";
import { newsStories, type NewsStory } from "@/data/news";
import { aartis as fallbackAartis, type Aarti } from "@/app/aarti/data";
import styles from "./culture.module.css";

type Tab = "panchang" | "arti" | "news";

const cultureFallbackVerses = [
  "सुखकर्ता दुःखहर्ता वार्ता विघ्नांची ।\nनुरवी पुरवी प्रेम कृपा जयाची ।\nसर्वांगी सुंदर उटी शेंदुराची ।\nकंठी झळके माळ मुक्ताफळांची ।।१।।",
  "जय देव जय देव जय मंगलमूर्ती ।\nदर्शनमात्रे मन कामना पुरती ।।धृ.।।",
  "रत्नखचित फरा तूज गौरीकुमरा ।\nचंदनाची उटी कुमकुम केशरा ।\nहिरे जडित मुकुट शोभतो बरा ।\nरुणझुणती नूपुरे चरणी घागरीया ।।२।।",
  "लंबोदर पीतांबर फणिवर वंदना ।\nसरळ सोंड वक्रतुंड त्रिनयना ।\nदास रामाचा वाट पाहे सदना ।\nसंकटी पावावे निर्वाणी रक्षावे सुरवरवंदना ।।३।।",
];

function normalizeCalendarMonths(payload: {
  records?: Array<Record<string, unknown>>;
}): MarathiMonth[] {
  const tones: MarathiMonth["tone"][] = [
    "saffron",
    "gold",
    "brick",
    "green",
    "blue",
    "pink",
  ];
  const records = payload.records || [];
  const marathiRecords = records.filter((record) => {
    const organization = record.AD_Org_ID as { id?: number } | undefined;
    return organization?.id === 0;
  });
  const source = marathiRecords.length ? marathiRecords : records;
  const seen = new Set<string>();

  return source
    .filter((record) => record.IsActive !== false)
    .filter((record) => {
      const name = String(record.Value || record.Name || "");
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((record, index) => {
      const image = record.Logo_ID as { id?: number } | undefined;
      const name = String(record.Value || record.Name || "Month");
      return {
        name,
        dev: String(record.MCS_DevanagariName || name),
        tone: tones[index % tones.length],
        days: Number(record.MCS_DayCount) || 30,
        current: false,
        image: image?.id ? `/api/image/${image.id}` : undefined,
      };
    });
}

function getUserId() {
  try {
    return Number(JSON.parse(localStorage.getItem("mcs_user") || "{}").id) || 0;
  } catch {
    return 0;
  }
}

function normalizeAartis(
  payload: Aarti[] | { records?: Array<Record<string, unknown>> },
): Aarti[] {
  const source = Array.isArray(payload) ? payload : payload.records || [];
  return source
    .filter((record) => (record as Record<string, unknown>).IsActive !== false)
    .map((record) => {
      if ("title" in record) return record as Aarti;
      const raw = record as Record<string, unknown> & {
        AD_Image_ID?: { id?: number };
        MCS_Aarati_Category_ID?: { identifier?: string };
        MCS_Duration?: string;
        MCS_IsPopular?: boolean;
        MCS_AudioURL?: string;
        AudioURL?: string;
        Name?: string;
        Value?: string;
        Help?: string;
        WeekDay?: { identifier?: string };
        MCS_YouTubeURL?: string;
        id?: number;
      };
      const image = raw.AD_Image_ID;
      return {
        id: Number(raw.id),
        title: String(raw.Name || raw.Value || "Aarti"),
        deity: String(raw.MCS_Aarati_Category_ID?.identifier || "Deity"),
        duration: String(raw.MCS_Duration || "2:00"),
        popular: raw.MCS_IsPopular === true,
        lyrics: String(raw.Help || ""),
        image: image?.id
          ? `/api/image/${image.id}`
          : "/assets/arti-list-logo.png",
        audio: String(
          raw.MCS_AudioURL || raw.AudioURL || "/assets/dummy-aarti.wav",
        ),
        weekday: String(raw.WeekDay?.identifier || ""),
        youtubeUrl: String(raw.MCS_YouTubeURL || ""),
      };
    });
}

export default function CulturePage() {
  const [tab, setTab] = useState<Tab>("panchang");
  const toast = useGlobalToast();
  const [panchangData, setPanchangData] = useState<any>(null);
  const [artisData, setArtisData] = useState<Aarti[]>([]);
  const [loadingArtis, setLoadingArtis] = useState(true);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [favorites, setFavorites] = useState(new Set<number>());
  const [favoriteIds, setFavoriteIds] = useState(new Map<number, number>());
  const [monthsData, setMonthsData] = useState<MarathiMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [cultureNews, setCultureNews] = useState<NewsStory[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/data/culture").then((response) => response.json()),
      fetch("/api/v1/models/MCS_MarathiCalendarMonths").then((response) =>
        response.ok ? response.json() : Promise.reject(),
      ),
    ])
      .then(([panchang, monthsRes]) => {
        if (Array.isArray(panchang) && panchang.length > 0) {
          setPanchangData(panchang[0]);
        }
        setMonthsData(normalizeCalendarMonths(monthsRes));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/data/news?top=5&skip=0")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((stories: NewsStory[]) => {
        setCultureNews(
          Array.isArray(stories) && stories.length ? stories : newsStories,
        );
      })
      .catch(() => setCultureNews(newsStories))
      .finally(() => setNewsLoading(false));

    fetch("/api/v1/models/MCS_Aarati")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        const records = normalizeAartis(payload);
        if (records.length) {
          setArtisData(records);
          setApiLoaded(true);
        } else {
          setArtisData(fallbackAartis);
        }
      })
      .catch(() => setArtisData(fallbackAartis))
      .finally(() => setLoadingArtis(false));

    const userId = getUserId();
    if (userId) {
      fetch(`/api/aarti/favorites?userId=${userId}`)
        .then((response) => response.json())
        .then((data) => {
          const records = (data.favorites || []) as Array<{
            id: number;
            aartiId: number;
          }>;
          setFavorites(new Set(records.map((favorite) => favorite.aartiId)));
          setFavoriteIds(
            new Map(records.map((favorite) => [favorite.aartiId, favorite.id])),
          );
        })
        .catch(() => undefined);
    }
  }, []);

  const toggleFavorite = async (id: number) => {
    const userId = getUserId();
    if (!userId || !apiLoaded || !artisData.some((item) => item.id === id))
      return;
    const active = !favorites.has(id);
    setFavorites((old) => {
      const next = new Set(old);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
    const response = await fetch("/api/aarti/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        aartiId: id,
        favoriteId: favoriteIds.get(id),
        active,
      }),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.favoriteId) {
        setFavoriteIds((old) =>
          new Map(old).set(id, Number(result.favoriteId)),
        );
      }
      return;
    }
    setFavorites((old) => {
      const next = new Set(old);
      if (active) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.inline1}>
      <PageHeader
        title="Culture"
        marathi="संस्कृती"
        subtitle="Panchang, Artis, news, and the rhythm of Marathi life across the world"
        actions={
          <>
            <Link href="/aarti" className={styles.inline2}>
              <Btn kind="ghost" size="md" iconL="lamp">
                Arti collection
              </Btn>
            </Link>
            <Link href="/news" className={styles.inline3}>
              <Btn kind="ghost" size="md" iconL="news">
                All news
              </Btn>
            </Link>
          </>
        }
      />

      {/* Tabs */}
      <div className={styles.inline4}>
        {[
          { k: "panchang" as Tab, label: "Panchang", dev: "पंचांग" },
          { k: "arti" as Tab, label: "Arti", dev: "आरती" },
          { k: "news" as Tab, label: "News", dev: "बातम्या" },
        ].map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`${styles.tab} ${active ? styles.tabActive : "nav-int"}`}
            >
              {t.label}
              <span className={styles.tabDev}>{t.dev}</span>
            </button>
          );
        })}
      </div>

      {tab === "panchang" && (
        <PanchangTab data={panchangData} loading={loading} toast={toast} />
      )}
      {tab === "arti" && (
        <ArtiTab
          artis={artisData}
          loading={loadingArtis}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {tab === "news" && (
        <NewsTab stories={cultureNews} loading={newsLoading} />
      )}

      {/* Months ribbon (always visible) */}
      <section>
        <SectionHead
          title="Marathi months"
          subtitle="Tap a month to view its panchang"
          accent="महिने"
        />
        <div className={`mob-3col ${styles.inline5}`}>
          {loading ? (
            <div className={styles.inline6}>Loading months...</div>
          ) : (
            monthsData.map((m, i) => (
              <Card
                key={i}
                pad={0}
                interactive
                className={styles.inline7}
                onClick={() => setSelectedMonth(m)}
              >
                {m.current && <div className={styles.inline8}>NOW</div>}
                {(m as any).image ? (
                  <div className={styles.inline9}>
                    <img
                      src={(m as any).image}
                      alt={m.name}
                      className={styles.inline10}
                    />
                  </div>
                ) : (
                  <ImgPh kind="panchang" tone={m.tone} height={90} />
                )}
                <div className={styles.inline11}>
                  <div className={styles.inline12}>{m.dev}</div>
                  <div className={styles.inline13}>{m.name}</div>
                  <div className={styles.inline14}>{m.days} days</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {selectedMonth && (
        <div className={styles.inline15} onClick={() => setSelectedMonth(null)}>
          <div className={styles.inline16} onClick={(e) => e.stopPropagation()}>
            <div className={styles.inline17}>
              <div>
                <div className={styles.inline18}>{selectedMonth.dev}</div>
                <div className={styles.inline19}>
                  {selectedMonth.name} Panchang
                </div>
              </div>
              <button
                onClick={() => setSelectedMonth(null)}
                className={styles.inline20}
              >
                &times;
              </button>
            </div>
            <div className={styles.inline21}>
              {selectedMonth.image ? (
                <img
                  src={selectedMonth.image}
                  alt={selectedMonth.name}
                  className={styles.inline22}
                />
              ) : (
                <div className={styles.inline23}>
                  No panchang image available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanchangTab({
  data,
  loading,
  toast,
}: {
  data: any;
  loading: boolean;
  toast: any;
}) {
  const [selectedDate, setSelectedDate] = useState<number>(7);
  const isSelectedFestival = festivalDays.includes(selectedDate);
  return (
    <div className={`mob-stack ${styles.inline24}`}>
      {/* Today */}
      <Card pad={0} className={styles.inline25}>
        <div className={styles.inline26}>
          <svg
            className={styles.inline27}
            width="180"
            height="180"
            viewBox="0 0 180 180"
            aria-hidden="true"
          >
            <g fill="none" stroke={C.saffronDk} strokeWidth="1">
              <circle cx="90" cy="90" r="74" />
              <circle cx="90" cy="90" r="54" />
              <circle cx="90" cy="90" r="34" />
            </g>
          </svg>
          <div className={styles.inline28}>Today · Boston, MA</div>
          <h2 className={styles.inline29}>
            <span className={styles.inline30}>वैशाख</span>
            {loading
              ? "..."
              : data
                ? `${data.tithi} ${data.day}`
                : `Vaishakh ${selectedDate}`}
          </h2>
          <div className={styles.inline31}>
            {loading
              ? "..."
              : data
                ? new Date(data.date).toLocaleDateString()
                : todayDateLine}
          </div>
        </div>
        <div className={styles.inline32}>
          {loading ? (
            <div className={styles.inline33}>Loading panchang...</div>
          ) : data ? (
            <>
              {[
                { key: "Tithi", value: data.tithi },
                { key: "Nakshatra", value: data.nakshatra },
                { key: "Yoga", value: data.yoga },
                { key: "Rashi", value: data.rashi },
                { key: "Sunrise", value: data.sunrise },
                { key: "Sunset", value: data.sunset },
              ].map((entry, i) => (
                <div
                  key={i}
                  className={`${styles.panchangRow} ${i < 5 ? styles.panchangRowBorder : ""}`}
                >
                  <span className={styles.inline34}>{entry.key}</span>
                  <span className={styles.inline35}>{entry.value}</span>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.inline36}>No panchang data</div>
          )}
        </div>
        <div className={styles.inline37}>
          <div className={styles.inline38}>
            Source: Drik Panchang · Date Panchang
          </div>
          <Btn
            kind="ghost"
            size="sm"
            icon="arrow"
            onClick={() =>
              window.open("https://www.drikpanchang.com/", "_blank")
            }
          >
            Open full panchang
          </Btn>
        </div>
      </Card>

      {/* Calendar grid */}
      <Card pad={0} className={styles.inline39}>
        <div className={styles.inline40}>
          <div>
            <div className={styles.inline41}>May 2026 · Vaishakh</div>
            <div className={styles.inline42}>
              Tap a date for tithi & festival info
            </div>
          </div>
          <div className={styles.inline43}>
            <button className={styles.inline44}>
              <Icon name="chevL" size={14} />
            </button>
            <button className={styles.inline45}>
              <Icon name="chevR" size={14} />
            </button>
          </div>
        </div>
        <div className={styles.inline46}>
          <div className={styles.inline47}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className={styles.inline48}>
                {d.toUpperCase()}
              </div>
            ))}
          </div>
          <div className={styles.inline49}>
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 4;
              const valid = day >= 1 && day <= 31;
              const today = day === 7;
              const festival = festivalDays.includes(day);
              const isSelected = day === selectedDate;
              return (
                <div
                  key={i}
                  onClick={() => valid && setSelectedDate(day)}
                  className={`${styles.calendarDay} ${today ? styles.calendarDayToday : ""} ${isSelected ? styles.calendarDaySelected : ""} ${valid ? styles.calendarDayValid : styles.calendarDayInvalid}`}
                >
                  {valid && (
                    <>
                      <div
                        className={`num ${styles.calendarNumber} ${today || isSelected ? styles.calendarNumberEmphasis : ""} ${isSelected ? styles.calendarNumberSelected : ""}`}
                      >
                        {day}
                      </div>
                      <div className={styles.inline50}>
                        {
                          [
                            "१",
                            "२",
                            "३",
                            "४",
                            "५",
                            "६",
                            "७",
                            "८",
                            "९",
                            "१०",
                            "११",
                            "१२",
                            "१३",
                            "१४",
                            "१५",
                          ][(day - 1) % 15]
                        }
                      </div>
                      {festival && <div className={styles.inline51} />}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.inline52}>
            <span className={styles.inline53}>
              <span className={styles.inline54} /> Festival
            </span>
            <span className={styles.inline55}>
              <span className={styles.inline56} /> Today
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ArtiTab({
  artis,
  loading,
  favorites,
  toggleFavorite,
}: {
  artis: Aarti[];
  loading: boolean;
  favorites: Set<number>;
  toggleFavorite: (id: number) => Promise<void>;
}) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const a = artis[active];
  const saved = a ? favorites.has(a.id) : false;
  const lyricVerses = a?.lyrics?.trim()
    ? a.lyrics.split(/\n\s*\n/)
    : cultureFallbackVerses;

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else await audioRef.current.play();
    setPlaying(!playing);
  };

  // Reset state when switching artis
  useEffect(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setShowAll(false);
  }, [active]);

  if (loading) return <div className={styles.inline57}>Loading artis...</div>;
  if (!a) return <div className={styles.inline57}>No artis found</div>;

  return (
    <div className={`mob-stack ${styles.inline58}`}>
      {/* List */}
      <Card pad={0}>
        <div className={styles.inline59}>
          <div className={styles.inline60}>120+ Artis</div>
          <div className={styles.inline61}>
            Devotional hymns curated by community
          </div>
        </div>
        <div className={styles.inline62}>
          {artis.map((it, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              className={`${styles.artiRow} ${i === active ? styles.artiRowActive : ""}`}
            >
              <div className={styles.inline63}>
                <Icon name="lamp" size={18} color={C.brick} />
              </div>
              <div className={styles.inline64}>
                <div className={styles.inline65}>
                  <span className={styles.inline66}>{it.title}</span>
                  {it.popular && (
                    <Tag color={C.saffronDk} bg={C.saffronLt}>
                      Popular
                    </Tag>
                  )}
                </div>
                <div className={styles.inline67}>
                  {it.deity} · {it.duration}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail */}
      <Card pad={0} className={styles.inline68}>
        {a.image && (
          <div className={styles.inline69}>
            <img src={a.image} alt={a.title} className={styles.inline70} />
          </div>
        )}
        <div className={styles.inline71}>
          <svg
            className={styles.inline72}
            width="220"
            height="220"
            viewBox="0 0 220 220"
            aria-hidden="true"
          >
            <path
              d="M 110 30 q 70 22 70 90 q 0 70 -70 70 q -70 0 -70 -70 q 0 -36 36 -56"
              fill="none"
              stroke={C.saffronDk}
              strokeWidth="1.4"
            />
            <path
              d="M 110 70 q 40 12 40 50 q 0 40 -40 40 q -40 0 -40 -40"
              fill="none"
              stroke={C.saffronDk}
              strokeWidth="1.2"
            />
          </svg>
          <div className={styles.inline73}>Arti · {a.deity}</div>
          <h2 className={styles.inline74}>{a.title}</h2>
          <audio
            ref={audioRef}
            src={a.audio || "/assets/dummy-aarti.wav"}
            onEnded={() => setPlaying(false)}
          />
          <div className={styles.inline75}>
            <Btn
              kind={playing ? "soft" : "primary"}
              size="md"
              iconL={playing ? "heart" : "lamp"}
              onClick={togglePlayback}
            >
              {playing ? "Playing..." : "Play audio"}
            </Btn>
            <Btn
              kind={saved ? "primary" : "ghost"}
              size="md"
              className={saved ? styles.savedButton : styles.unsavedButton}
              iconL="heart"
              onClick={() => toggleFavorite(a.id)}
            >
              {saved ? "Saved" : "Save"}
            </Btn>
          </div>
        </div>
        <div className={styles.inline76}>
          {lyricVerses
            .slice(0, showAll ? lyricVerses.length : 2)
            .map((verse, index) => (
              <div
                key={index}
                className={index === 1 ? styles.inline77 : undefined}
              >
                {verse.split("\n").map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    <br />
                  </span>
                ))}
                {index < lyricVerses.length - 1 && <br />}
              </div>
            ))}
        </div>
        <div className={styles.inline78}>
          {showAll ? (
            <span className={styles.inline79} onClick={() => setShowAll(false)}>
              Show less
            </span>
          ) : (
            <>
              Showing {Math.min(2, lyricVerses.length)} of {lyricVerses.length}{" "}
              verses ·{" "}
              <span
                className={styles.inline80}
                onClick={() => setShowAll(true)}
              >
                Show all
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function NewsTab({
  stories,
  loading,
}: {
  stories: NewsStory[];
  loading: boolean;
}) {
  if (loading) {
    return <div className={styles.inline57}>Loading news...</div>;
  }

  const source = stories.length ? stories : newsStories;
  const featured = source.find((story) => story.featured) ?? source[0];
  const sideStories = source
    .filter((story) => story.id !== featured.id)
    .slice(0, 4);

  return (
    <section>
      <div className={`mob-stack ${styles.inline81}`}>
        {/* Featured */}
        <Link href="/news" className={styles.inline82}>
          <Card pad={0} interactive className={styles.inline83}>
            <ImgPh kind="news" tone={featured.tone} height={280} />
            <div className={styles.inline84}>
              <Tag color={C.brick} bg="#FAE0DA">
                Featured · {featured.cat}
              </Tag>
              <h3 className={styles.inline85}>{featured.title}</h3>
              <div className={styles.inline86}>
                {featured.when} · 4 min read
              </div>
            </div>
          </Card>
        </Link>

        {/* Side stack */}
        <div className={styles.inline87}>
          {sideStories.map((n, i) => (
            <Link key={i} href="/news" className={styles.inline88}>
              <Card pad={14} interactive className={styles.inline89}>
                <div className={styles.inline90}>
                  <ImgPh kind="news" tone={n.tone} height={64} />
                </div>
                <div className={styles.inline91}>
                  <Tag color={C.saffronDk} bg={C.saffronLt}>
                    {n.cat}
                  </Tag>
                  <h4 className={styles.inline92}>{n.title}</h4>
                  <div className={styles.inline93}>{n.when}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.inline94}>
        <Link href="/news" className={styles.inline95}>
          <Btn kind="ghost" size="md" icon="arrow">
            All news →
          </Btn>
        </Link>
      </div>
    </section>
  );
}
