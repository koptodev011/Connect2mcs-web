'use client';

import { useState } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, SectionHead, PageHeader, Modal, Field } from '@/components/primitives';
import { exchangeRates, rateProviders, usdInrTrend } from '@/data/rates';
import type { Currency } from '@/data/rates';


export default function RatesPage() {
  const [from, setFrom] = useState<Currency>('USD');
  const [amount, setAmount] = useState('1000');
  const [alerts, setAlerts] = useState<{ currency: string; target: string }[]>([
    { currency: 'USD', target: '83.50' }
  ]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [targetRate, setTargetRate] = useState('');

  const selectedRate = exchangeRates.find(r => r.code === from) ?? exchangeRates[0];
  const inr = (parseFloat(amount) || 0) * selectedRate.rate;

  const maxTrend = Math.max(...usdInrTrend);
  const minTrend = Math.min(...usdInrTrend);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Live Rates"
        marathi="दर"
        subtitle="Currency exchange rates for NRIs · updated every 15 minutes"
        actions={<>
          <Tag color={C.green} bg={C.greenLt}>● Live · as of 10:45 am IST</Tag>
          <Btn kind="ghost" size="md" iconL="bell" onClick={() => setAlertOpen(true)}>New alert</Btn>
        </>}
      />

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <section>
          <SectionHead title="Active alerts" subtitle="We'll notify you when your target is reached" />
          <div className="mob-stack" style={{ display: 'flex', gap: 14 }}>
            {alerts.map((a, i) => (
              <Card key={i} pad={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, minWidth: 240 }}>
                <div>
                  <div style={{ fontSize: 13, color: C.ink3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>1 {a.currency} = </div>
                  <div className="num" style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 2 }}>₹{a.target}</div>
                </div>
                <button 
                  onClick={() => setAlerts(alerts.filter((_, idx) => idx !== i))}
                  style={{ background: C.bgDeep, border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.brick, fontSize: 24, paddingBottom: 2 }}
                  title="Remove alert"
                >
                  &times;
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Hero converter + chart */}
      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* Converter */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(140deg, #FFF8EB 0%, #FFD9A6 100%)', padding: '24px 24px 20px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Currency converter
            </div>
            <div className="mob-stack" style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {/* From */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>From</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', border: `1px solid ${C.lineMid}`, borderRadius: 10, padding: '10px 12px' }}>
                  <select
                    value={from}
                    onChange={e => setFrom(e.target.value as Currency)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: 'inherit', flex: 1 }}
                  >
                    {exchangeRates.map(r => <option key={r.code} value={r.code}>{r.flag} {r.code}</option>)}
                  </select>
                </div>
              </div>
              {/* Amount */}
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Amount</div>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: `1px solid ${C.lineMid}`,
                    borderRadius: 10, fontSize: 15, fontWeight: 700, outline: 'none',
                    fontFamily: F.display, color: C.ink,
                  }}
                />
              </div>
            </div>

            {/* Result */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: `1px solid ${C.line}`, marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                You receive (INR ₹)
              </div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: '-0.03em' }}>
                ₹{inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, marginTop: 4 }}>
                1 {from} = ₹{selectedRate.rate.toFixed(2)} · Rate valid for ~15 min
              </div>
            </div>
          </div>
          {/* Best provider */}
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Best rate right now</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.greenLt, borderRadius: 10, border: `1px solid ${C.green}22` }}>
              <Icon name="verify" size={22} color={C.green}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Wise · ₹{(inr * (rateProviders[0].rate / selectedRate.rate)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>No transfer fee · Instant transfer</div>
              </div>
              <Btn kind="primary" size="sm" onClick={() => window.open('https://wise.com', '_blank')}>Send now</Btn>
            </div>
          </div>
        </Card>

        {/* Mini trend chart */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>USD / INR · 7-day trend</div>
              <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>1 USD = <strong style={{ color: C.ink }}>₹83.42</strong>
                <span style={{ color: C.green, fontWeight: 700, marginLeft: 8 }}>▲ +0.18 today</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>7-day range</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 3 }}>
                ₹{minTrend.toFixed(2)} – ₹{maxTrend.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ padding: '24px 22px' }}>
            {/* Sparkline */}
            <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.saffron} stopOpacity="0.18"/>
                  <stop offset="100%" stopColor={C.saffron} stopOpacity="0.02"/>
                </linearGradient>
              </defs>
              {(() => {
                const pts = usdInrTrend.map((v, i) => ({
                  x: (i / (usdInrTrend.length - 1)) * 280 + 10,
                  y: 70 - ((v - minTrend) / (maxTrend - minTrend)) * 60,
                }));
                const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                const fill = path + ` L${pts[pts.length - 1].x},75 L${pts[0].x},75 Z`;
                return (
                  <>
                    <path d={fill} fill="url(#trendFill)"/>
                    <path d={path} fill="none" stroke={C.saffron} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5}
                        fill={i === pts.length - 1 ? C.saffron : '#fff'}
                        stroke={C.saffron} strokeWidth="1.5"/>
                    ))}
                  </>
                );
              })()}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: C.ink4, fontWeight: 600 }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
          {/* Stats row */}
          <div className="mob-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${C.line}` }}>
            {[['Open','₹83.12'],['High','₹83.68'],['Close','₹83.42']].map(([k, v], i) => (
              <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${C.line}` : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
                <div className="num" style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* All rates table */}
      <section>
        <SectionHead title="All rates" subtitle="Foreign currency to Indian Rupee · live market rates" action="Download CSV"/>
        <Card pad={0} className="mob-scroll-table">
          <div style={{ display: 'grid', minWidth: 600, gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr', padding: '10px 20px', borderBottom: `1px solid ${C.line}`, fontSize: 10.5, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <div>Currency</div><div style={{ textAlign: 'right' }}>Rate (₹)</div>
            <div style={{ textAlign: 'right' }}>24h Change</div>
            <div style={{ textAlign: 'right' }}>High</div>
            <div style={{ textAlign: 'right' }}>Low</div>
          </div>
          {exchangeRates.map((r, i) => (
            <div key={r.code} style={{
              display: 'grid', minWidth: 600, gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr',
              padding: '16px 20px', alignItems: 'center',
              borderBottom: i < exchangeRates.length - 1 ? `1px solid ${C.line}` : 'none',
              background: r.popular ? C.surfaceAlt : '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{r.flag}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{r.code}</div>
                  <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 1 }}>{r.name}</div>
                </div>
                {r.popular && <Tag color={C.saffronDk} bg={C.saffronLt}>Popular</Tag>}
              </div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.ink, textAlign: 'right' }}>
                ₹{r.rate.toFixed(2)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: r.change >= 0 ? C.green : C.brick }}>
                  {r.change >= 0 ? '▲' : '▼'} {Math.abs(r.change).toFixed(2)}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: C.ink2, fontWeight: 600 }}>₹{r.high.toFixed(2)}</div>
              <div style={{ textAlign: 'right', fontSize: 13, color: C.ink2, fontWeight: 600 }}>₹{r.low.toFixed(2)}</div>
            </div>
          ))}
        </Card>
      </section>

      {/* Transfer providers comparison */}
      <section>
        <SectionHead title="Best transfer rates" subtitle="Compare providers sending USD to INR · for $1,000" action="See all providers"/>
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {rateProviders.map((p) => (
            <Card key={p.name} pad={0} interactive style={{ overflow: 'hidden', position: 'relative' }}>
              {p.best && (
                <div style={{ background: C.green, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textAlign: 'center', padding: '5px 0', textTransform: 'uppercase' }}>
                  ● Best rate today
                </div>
              )}
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 14 }}>{p.name}</div>
                <div className="num" style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.saffronDk, letterSpacing: '-0.03em' }}>
                  ₹{p.rate.toFixed(2)}
                </div>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>per USD · interbank</div>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: C.ink2, fontWeight: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.ink3 }}>Transfer fee</span>
                    <strong style={{ color: C.ink }}>{p.fee}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.ink3 }}>Speed</span>
                    <strong style={{ color: C.ink }}>{p.time}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.ink3 }}>Rating</span>
                    <strong style={{ color: C.ink }}>★ {p.score}</strong>
                  </div>
                </div>
                <Btn kind={p.best ? 'primary' : 'outline'} size="sm" full style={{ marginTop: 14 }}>
                  Send with {p.name}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div style={{ textAlign: 'center', fontSize: 12, color: C.ink4, fontWeight: 500, paddingTop: 4 }}>
        Rates are indicative · sourced from open market data · always confirm with your provider before transferring
      </div>

      <Modal isOpen={alertOpen} onClose={() => setAlertOpen(false)} title="Set Rate Alert" width={400}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.ink3, fontWeight: 500, marginBottom: 16 }}>
            Current rate: <strong>1 {from} = ₹{selectedRate.rate.toFixed(2)}</strong>
          </div>
          <Field 
            label="Target rate (INR)" 
            value={targetRate} 
            onChange={setTargetRate} 
            placeholder="e.g. 84.50" 
            type="number"
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" size="md" full onClick={() => {
            if (targetRate && !isNaN(parseFloat(targetRate))) {
              setAlerts(a => [...a, { currency: from, target: targetRate }]);
              setTargetRate('');
              setAlertOpen(false);
            }
          }}>Create alert</Btn>
          <Btn kind="ghost" size="md" onClick={() => setAlertOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}
