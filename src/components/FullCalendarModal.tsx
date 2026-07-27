'use client';

import { useState } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn } from '@/components/primitives';

export function FullCalendarModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handlePrevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const handleNextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,12,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>Calendar</h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: C.bgDeep, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: C.ink2 }}>
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handlePrevYear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink3 }}><Icon name="chevL" size={12} /><span style={{ marginLeft: -6 }}><Icon name="chevL" size={12}/></span></button>
              <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink3 }}><Icon name="chevL" size={16}/></button>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.display, width: 160, textAlign: 'center' }}>
                {monthNames[month]} {year}
              </div>
              <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink3 }}><Icon name="chevR" size={16}/></button>
              <button onClick={handleNextYear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink3 }}><Icon name="chevR" size={12}/><span style={{ marginLeft: -6 }}><Icon name="chevR" size={12}/></span></button>
            </div>
            <Btn kind="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Btn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {days.map((d, i) => {
              const hasEvent = d && Math.random() > 0.7; // Simulate events
              return (
                <div key={i} style={{ 
                  aspectRatio: '1', borderRadius: 12, border: `1px solid ${C.line}`, 
                  display: 'flex', flexDirection: 'column', padding: 8,
                  background: d ? '#fff' : C.bgDeep, cursor: d ? 'pointer' : 'default',
                  transition: 'border 0.15s'
                }}
                onMouseEnter={e => d && (e.currentTarget.style.borderColor = C.saffron)}
                onMouseLeave={e => d && (e.currentTarget.style.borderColor = C.line)}
                >
                  {d && (
                    <>
                      <div className="num" style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{d}</div>
                      {hasEvent && (
                        <div style={{ marginTop: 'auto', background: C.saffronLt, color: C.saffronDk, fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          1 Event
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
