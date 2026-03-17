import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, Cell
} from 'recharts'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const CATEGORIES = [
  { id:  1, name: 'Schlaf',              desc: 'Physische Regeneration',                    color: '#93a8c9', hex: '#93a8c9' },
  { id:  2, name: 'Erwerbsarbeit',       desc: 'Zeit für Beruf / Einkommen',                color: '#7faa8d', hex: '#7faa8d' },
  { id:  3, name: 'Hausarbeit/Orga',     desc: 'Kochen, Putzen, Administration',            color: '#c8b97e', hex: '#c8b97e' },
  { id:  4, name: 'Selbstverwirklichung',desc: 'Hobbys, die Energie geben',                 color: '#a98dc9', hex: '#a98dc9' },
  { id:  5, name: 'Paar-Zeit',           desc: 'Bewusste Zeit nur für die Beziehung',       color: '#c98d9a', hex: '#c98d9a' },
  { id:  6, name: 'Soziale Kontakte',    desc: 'Freunde und erweiterte Familie',            color: '#6db8a4', hex: '#6db8a4' },
  { id:  7, name: 'Sport/Gesundheit',    desc: 'Aktive Körperpflege',                       color: '#90b86b', hex: '#90b86b' },
  { id:  8, name: 'Pendeln/Logistik',    desc: 'Wegezeiten',                                color: '#b8b055', hex: '#b8b055' },
  { id:  9, name: 'Bildung/Lernen',      desc: 'Persönliche Weiterentwicklung',             color: '#68a8c0', hex: '#68a8c0' },
  { id: 10, name: 'Digitale Zeit',       desc: 'Social Media, TV, Gaming',                  color: '#c89068', hex: '#c89068' },
  { id: 11, name: 'Care-Arbeit',         desc: 'Kinderbetreuung / Pflege von Angehörigen',  color: '#daa85a', hex: '#daa85a' },
  { id: 12, name: 'Stille/Meditation',   desc: 'Zeit für Introspektion',                    color: '#80aab8', hex: '#80aab8' },
  { id: 13, name: 'Erledigungen',        desc: 'Einkaufen, Botengänge',                     color: '#b878a0', hex: '#b878a0' },
  { id: 14, name: 'Entspannung',         desc: 'Bewusstes Nichtstun / Dösen',               color: '#b8a890', hex: '#b8a890' },
  { id: 15, name: 'Kreativität',         desc: 'Künstlerisches Schaffen oder Handwerk',     color: '#8898c8', hex: '#8898c8' },
]

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const SLOTS_PER_DAY = 48  // 30-min intervals in 24h

function createEmptySchedule() {
  return Array.from({ length: 7 }, () => Array(SLOTS_PER_DAY).fill(null))
}

function createDefaultPriorities() {
  return Object.fromEntries(CATEGORIES.map(c => [c.id, 5]))
}

function slotToTime(slot) {
  const h = Math.floor(slot / 2).toString().padStart(2, '0')
  const m = slot % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
}

function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || null
}

function calcHoursPerCategory(schedule) {
  const counts = {}
  CATEGORIES.forEach(c => (counts[c.id] = 0))
  schedule.forEach(day => day.forEach(slot => {
    if (slot !== null) counts[slot] = (counts[slot] || 0) + 0.5
  }))
  return counts
}

// ─────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────

function Header({ personName, step, onNameChange }) {
  return (
    <header className="w-full border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide" style={{ color: 'var(--color-text)', fontWeight: 400 }}>
            Vogt<span style={{ color: 'var(--color-sage)' }}>·</span>Coaching
          </h1>
          <p className="text-xs mt-0.5 tracking-widest uppercase" style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Paar-Vorbereitung · Zeitanalyse
          </p>
        </div>
        <div className="flex items-center gap-4">
          {step < 3 && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Ihr Name</span>
              <input
                value={personName}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Name eingeben …"
                className="text-sm px-3 py-1.5 rounded-lg border outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-border)',
                  fontFamily: "'Source Sans 3', sans-serif",
                  color: 'var(--color-text)',
                  background: 'var(--color-bg)',
                  '--tw-ring-color': 'var(--color-sage-light)',
                  width: 160,
                }}
              />
            </div>
          )}
          {step === 3 && personName && (
            <span className="name-badge">👤 {personName}</span>
          )}
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────

function StepIndicator({ step, onStep }) {
  const steps = [
    { n: 1, label: '24h-Wochenplan', sub: 'Zeitverwendung erfassen' },
    { n: 2, label: 'Priorisierung',   sub: 'Werte-Check 1–10' },
    { n: 3, label: 'Vergleich',       sub: 'Partner-Analyse' },
  ]

  return (
    <div className="w-full" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => s.n <= step + 1 && onStep(s.n - 1)}
                className="flex items-center gap-3 flex-1 py-2 px-3 rounded-lg transition-colors text-left"
                style={{
                  background: step === s.n - 1 ? '#f0f6f2' : 'transparent',
                  cursor: s.n <= step + 1 ? 'pointer' : 'default',
                }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                  style={{
                    background: s.n - 1 < step ? 'var(--color-sage)' : s.n - 1 === step ? 'var(--color-sage)' : '#e2e8e4',
                    color: s.n - 1 <= step ? 'white' : 'var(--color-text-muted)',
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  {s.n - 1 < step ? '✓' : s.n}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: s.n - 1 === step ? 'var(--color-sage)' : s.n - 1 < step ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {s.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.sub}</div>
                </div>
              </button>
              {i < 2 && (
                <div className="flex-shrink-0 w-8 h-px mx-1" style={{ background: 'var(--color-border)' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CATEGORY PALETTE
// ─────────────────────────────────────────────

function CategoryPalette({ selected, onSelect, compact = false }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(selected === cat.id ? null : cat.id)}
            className="tooltip rounded-md transition-all border-2"
            data-tip={cat.name}
            style={{
              width: 24, height: 24,
              background: cat.color,
              borderColor: selected === cat.id ? '#2c3830' : 'transparent',
              transform: selected === cat.id ? 'scale(1.15)' : 'scale(1)',
              boxShadow: selected === cat.id ? '0 0 0 2px white, 0 0 0 4px ' + cat.color : 'none',
            }}
          />
        ))}
        <button
          onClick={() => onSelect('erase')}
          className="tooltip rounded-md border-2 flex items-center justify-center text-xs"
          data-tip="Löschen"
          style={{
            width: 24, height: 24,
            background: selected === 'erase' ? '#f0f3f1' : '#f8f9fa',
            borderColor: selected === 'erase' ? '#2c3830' : 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(selected === cat.id ? null : cat.id)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all border"
          style={{
            background: selected === cat.id ? cat.color + '30' : 'transparent',
            borderColor: selected === cat.id ? cat.color : 'transparent',
            fontSize: 11,
            color: 'var(--color-text)',
          }}
        >
          <span className="flex-shrink-0 w-3 h-3 rounded-sm" style={{ background: cat.color }} />
          <span className="truncate font-medium" style={{ fontSize: 11 }}>{cat.name}</span>
        </button>
      ))}
      <button
        onClick={() => onSelect('erase')}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all border"
        style={{
          background: selected === 'erase' ? '#fef0f0' : 'transparent',
          borderColor: selected === 'erase' ? '#e08080' : 'transparent',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        <span className="flex-shrink-0 w-3 h-3 rounded-sm border" style={{ borderColor: '#d0d9d4' }}>
          <span className="block w-full h-full flex items-center justify-center text-[8px]">✕</span>
        </span>
        <span className="font-medium" style={{ fontSize: 11 }}>Löschen</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// WEEK SCHEDULE GRID
// ─────────────────────────────────────────────

function WeekScheduleGrid({ schedule, onScheduleChange, selectedCat, readOnly = false, label = '' }) {
  const isPainting = useRef(false)

  const paint = useCallback((dayIdx, slotIdx) => {
    if (readOnly) return
    const newSched = schedule.map(d => [...d])
    newSched[dayIdx][slotIdx] = selectedCat === 'erase' ? null : selectedCat
    onScheduleChange(newSched)
  }, [schedule, selectedCat, onScheduleChange, readOnly])

  useEffect(() => {
    const stop = () => { isPainting.current = false }
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  const CELL_H = 12  // px per 30-min cell
  const COL_W  = 70  // px per day column

  return (
    <div className="week-grid-wrapper">
      {label && <div className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>{label}</div>}
      <div className="flex">
        {/* Time axis */}
        <div className="flex-shrink-0" style={{ width: 44 }}>
          <div style={{ height: 28 }} /> {/* Day header spacer */}
          {Array.from({ length: 25 }, (_, h) => (
            <div
              key={h}
              className="text-right pr-2 leading-none"
              style={{
                height: CELL_H * 2,
                fontSize: 9,
                color: 'var(--color-text-muted)',
                lineHeight: `${CELL_H * 2}px`,
                fontFamily: "'Source Sans 3', sans-serif",
                marginTop: h === 0 ? 0 : -CELL_H * 2 / (SLOTS_PER_DAY / 24),
              }}
            >
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex-shrink-0" style={{ width: COL_W }}>
            {/* Day header */}
            <div
              className="text-center font-medium pb-1 border-b"
              style={{
                height: 28,
                fontSize: 12,
                color: dayIdx >= 5 ? 'var(--color-sage)' : 'var(--color-text)',
                borderColor: 'var(--color-border)',
                paddingTop: 6,
                fontFamily: "'Source Sans 3', sans-serif",
              }}
            >
              {day}
            </div>

            {/* Slots */}
            <div className="relative">
              {Array.from({ length: SLOTS_PER_DAY }, (_, slotIdx) => {
                const catId = schedule[dayIdx][slotIdx]
                const cat = catId !== null ? getCategoryById(catId) : null
                const isHour = slotIdx % 2 === 0

                return (
                  <div
                    key={slotIdx}
                    className="schedule-cell"
                    style={{
                      height: CELL_H,
                      background: cat ? cat.color : undefined,
                      borderTop: isHour ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      margin: '0 2px',
                    }}
                    data-tip={cat ? cat.name + ' ' + slotToTime(slotIdx) : slotToTime(slotIdx)}
                    onMouseDown={e => {
                      if (readOnly) return
                      e.preventDefault()
                      isPainting.current = true
                      paint(dayIdx, slotIdx)
                    }}
                    onMouseEnter={() => {
                      if (!readOnly && isPainting.current) paint(dayIdx, slotIdx)
                    }}
                    onTouchStart={e => {
                      if (readOnly) return
                      e.preventDefault()
                      isPainting.current = true
                      paint(dayIdx, slotIdx)
                    }}
                    onTouchMove={e => {
                      if (readOnly || !isPainting.current) return
                      const touch = e.touches[0]
                      const el = document.elementFromPoint(touch.clientX, touch.clientY)
                      if (el) el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
                    }}
                  >
                    {!cat && <div className="schedule-cell empty" style={{ height: '100%' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 1: 24H WEEK SCHEDULE
// ─────────────────────────────────────────────

function ScheduleStep({ schedule, onScheduleChange, personName }) {
  const [selectedCat, setSelectedCat] = useState(1)
  const [fillDay, setFillDay]     = useState(null)
  const [fillFrom, setFillFrom]   = useState('')
  const [fillTo, setFillTo]       = useState('')
  const [fillCat, setFillCat]     = useState(1)
  const [showFill, setShowFill]   = useState(false)

  const hours = calcHoursPerCategory(schedule)
  const totalFilled = Object.values(hours).reduce((a, b) => a + b, 0)
  const totalSlots  = 7 * 48

  function applyFill() {
    if (fillDay === null || !fillFrom || !fillTo) return
    const fromSlot = parseInt(fillFrom) * 2 + (fillFrom.includes('.5') ? 1 : 0)
    const [fh, fm] = fillFrom.split(':').map(Number)
    const [th, tm] = fillTo.split(':').map(Number)
    const fs = fh * 2 + (fm >= 30 ? 1 : 0)
    const ts = th * 2 + (tm >= 30 ? 1 : 0)
    if (fs >= ts) return
    const newSched = schedule.map(d => [...d])
    for (let i = fs; i < ts; i++) {
      newSched[fillDay][i] = fillCat === 'erase' ? null : fillCat
    }
    onScheduleChange(newSched)
    setShowFill(false)
  }

  function clearAll() {
    if (window.confirm('Gesamten Wochenplan leeren?')) onScheduleChange(createEmptySchedule())
  }

  const fillPct = Math.round((totalFilled / (7 * 24)) * 100)

  return (
    <div className="step-content space-y-6">
      {/* Intro card */}
      <div className="card px-6 py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl mb-1" style={{ fontWeight: 400 }}>
              Ihr typischer Wochenplan
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)', maxWidth: 520 }}>
              Malen Sie Ihren Wochenrhythmus in das Raster. Wählen Sie links eine Kategorie und klicken / ziehen Sie die Zeitblöcke ein.
              Jeder Block entspricht 30 Minuten.
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-display" style={{ color: 'var(--color-sage)' }}>{fillPct}%</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>erfasst ({totalFilled}h)</div>
            <div className="w-32 mt-2 rounded-full overflow-hidden" style={{ height: 6, background: '#e2e8e4' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, background: 'var(--color-sage)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Sidebar: palette + stats */}
        <div className="flex-shrink-0 space-y-4" style={{ width: 220 }}>
          <div className="card px-4 py-4">
            <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Kategorie wählen
            </div>
            <CategoryPalette selected={selectedCat} onSelect={setSelectedCat} />
          </div>

          {/* Quick-fill panel */}
          <div className="card px-4 py-4">
            <button
              className="w-full text-xs font-medium flex items-center justify-between"
              onClick={() => setShowFill(!showFill)}
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="uppercase tracking-widest">Schnell-Eintrag</span>
              <span>{showFill ? '▲' : '▼'}</span>
            </button>
            {showFill && (
              <div className="mt-3 space-y-2">
                <select
                  value={fillDay ?? ''}
                  onChange={e => setFillDay(Number(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 rounded border outline-none"
                  style={{ borderColor: 'var(--color-border)', fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  <option value="">Tag wählen…</option>
                  {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
                <div className="flex gap-1">
                  <input
                    type="time"
                    value={fillFrom}
                    onChange={e => setFillFrom(e.target.value)}
                    className="flex-1 text-xs px-2 py-1.5 rounded border outline-none"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <span className="text-xs self-center" style={{ color: 'var(--color-text-muted)' }}>–</span>
                  <input
                    type="time"
                    value={fillTo}
                    onChange={e => setFillTo(e.target.value)}
                    className="flex-1 text-xs px-2 py-1.5 rounded border outline-none"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                <select
                  value={fillCat}
                  onChange={e => setFillCat(e.target.value === 'erase' ? 'erase' : Number(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 rounded border outline-none"
                  style={{ borderColor: 'var(--color-border)', fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="erase">— Löschen —</option>
                </select>
                <button onClick={applyFill} className="btn-primary w-full text-xs py-1.5">Eintragen</button>
              </div>
            )}
          </div>

          <button onClick={clearAll} className="btn-secondary w-full text-xs py-1.5">Plan leeren</button>

          {/* Hours summary */}
          <div className="card px-4 py-4">
            <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Wochenstunden
            </div>
            <div className="space-y-1.5">
              {CATEGORIES.filter(c => hours[c.id] > 0).map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text)', fontSize: 10 }}>{c.name}</span>
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                    {hours[c.id]}h
                  </span>
                </div>
              ))}
              {Object.values(hours).every(h => h === 0) && (
                <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Noch keine Einträge</p>
              )}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="card flex-1 px-5 py-5 overflow-hidden">
          <div className="mb-3 flex items-center gap-3">
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Ausgewählt:
            </div>
            {selectedCat && selectedCat !== 'erase' ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: getCategoryById(selectedCat)?.color }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {getCategoryById(selectedCat)?.name}
                </span>
              </div>
            ) : selectedCat === 'erase' ? (
              <span className="text-xs font-medium" style={{ color: '#e08080' }}>Radierer aktiv</span>
            ) : (
              <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Bitte Kategorie wählen</span>
            )}
          </div>
          <WeekScheduleGrid
            schedule={schedule}
            onScheduleChange={onScheduleChange}
            selectedCat={selectedCat}
          />
          <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Klicken und ziehen zum Malen · Radierer-Werkzeug zum Löschen einzelner Blöcke
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 2: PRIORITY RATING
// ─────────────────────────────────────────────

function PriorityStep({ priorities, onPriorityChange, schedule }) {
  const hours = calcHoursPerCategory(schedule)
  const totalHours = 7 * 24

  const PRIORITY_LABELS = {
    1: 'völlig egal',
    2: 'kaum relevant',
    3: 'wenig wichtig',
    4: 'leicht wichtig',
    5: 'neutral',
    6: 'etwas wichtig',
    7: 'wichtig',
    8: 'sehr wichtig',
    9: 'essenziell',
    10: 'lebensnotwendig'
  }

  function getGapSeverity(catId) {
    const pct = hours[catId] / totalHours
    const prio = priorities[catId] / 10
    const diff = prio - pct
    if (diff > 0.15) return 'high'
    if (diff > 0.05) return 'mid'
    if (diff < -0.1) return 'over'
    return 'ok'
  }

  const GapColors = { high: '#c98d9a', mid: '#daa85a', over: '#93a8c9', ok: '#7faa8d' }
  const GapLabels = { high: 'Unterrepräsentiert', mid: 'Leicht unterversorgt', over: 'Überrepräsentiert', ok: 'Ausgewogen' }

  return (
    <div className="step-content space-y-6">
      <div className="card px-6 py-5">
        <h2 className="font-display text-2xl mb-1" style={{ fontWeight: 400 }}>Werte-Check: Was ist Ihnen wirklich wichtig?</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)', maxWidth: 580 }}>
          Bewerten Sie jede Kategorie auf einer Skala von 1 bis 10 – unabhängig davon, wie viel Zeit Sie ihr aktuell widmen.
          Das Balkendiagramm zeigt Ihnen die Lücke zwischen Wunsch und Wirklichkeit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {CATEGORIES.map(cat => {
          const p = priorities[cat.id]
          const h = hours[cat.id]
          const hPct = Math.min(100, (h / totalHours) * 100)
          const pPct = p * 10
          const severity = getGapSeverity(cat.id)

          return (
            <div key={cat.id} className="card px-5 py-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Color swatch */}
                <div
                  className="flex-shrink-0 w-3 rounded-sm mt-1.5"
                  style={{ background: cat.color, alignSelf: 'stretch', minHeight: 40 }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div>
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{cat.name}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{cat.desc}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: GapColors[severity] + '25', color: GapColors[severity] }}
                      >
                        {GapLabels[severity]}
                      </span>
                      <div className="text-right" style={{ minWidth: 80 }}>
                        <span className="text-xl font-display" style={{ color: 'var(--color-sage)', fontWeight: 500 }}>{p}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>/10</span>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {PRIORITY_LABELS[p]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={p}
                    onChange={e => onPriorityChange(cat.id, Number(e.target.value))}
                    className="w-full mt-1"
                    style={{ accentColor: cat.color }}
                  />

                  {/* Dual bar: reality vs wish */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-14 text-right flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>Realität</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: '#eef0f5' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${hPct}%`, background: cat.color }}
                        />
                      </div>
                      <span className="text-xs w-10 flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{h.toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-14 text-right flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>Priorität</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: '#eef0f5' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pPct}%`, background: cat.color + 'aa' }}
                        />
                      </div>
                      <span className="text-xs w-10 flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{p}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 3: COMPARISON
// ─────────────────────────────────────────────

function ComparisonStep({ myData, partnerData, setPartnerData }) {
  const [view, setView] = useState('side')  // 'side' | 'heatmap' | 'priority'
  const fileInputRef = useRef(null)

  function importPartner(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.schedule && data.priorities) {
          setPartnerData(data)
        } else {
          alert('Ungültiges Dateiformat. Bitte eine Vogt-Coaching Exportdatei verwenden.')
        }
      } catch {
        alert('Datei konnte nicht gelesen werden.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const myHours      = calcHoursPerCategory(myData.schedule)
  const partnerHours = partnerData ? calcHoursPerCategory(partnerData.schedule) : null

  // Build comparison chart data
  const chartData = CATEGORIES.map(cat => ({
    name: cat.name.length > 10 ? cat.name.substring(0, 10) + '…' : cat.name,
    fullName: cat.name,
    mich:    myHours[cat.id],
    partner: partnerHours ? partnerHours[cat.id] : 0,
    meinP:   myData.priorities[cat.id],
    partnerP: partnerData ? partnerData.priorities[cat.id] : 0,
    color:   cat.color,
  }))

  return (
    <div className="step-content space-y-6">
      {/* Header card */}
      <div className="card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl mb-1" style={{ fontWeight: 400 }}>Partner-Vergleich</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Importieren Sie die exportierte Datei Ihres Partners, um Gemeinsamkeiten und Unterschiede zu visualisieren.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {partnerData && (
              <span className="name-badge" style={{ background: '#e8edf5', color: '#546786' }}>
                👤 {partnerData.name || 'Partner/in'}
              </span>
            )}
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importPartner} />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm">
              {partnerData ? '↻ Datei wechseln' : '↑ Partner-Datei importieren'}
            </button>
          </div>
        </div>

        {/* View toggle */}
        {partnerData && (
          <div className="flex gap-2 mt-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { id: 'side',     label: '⊞  Nebeneinander' },
              { id: 'heatmap',  label: '⬛  Überlagerung' },
              { id: 'priority', label: '▥  Priorisierung' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className="px-4 py-2 rounded-lg text-sm transition-all font-medium"
                style={{
                  background: view === v.id ? 'var(--color-sage)' : 'transparent',
                  color: view === v.id ? 'white' : 'var(--color-text-muted)',
                  border: view === v.id ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!partnerData && (
        <div
          className="card px-8 py-16 text-center cursor-pointer transition-all"
          style={{ borderStyle: 'dashed', borderColor: 'var(--color-sage-light)' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-3 opacity-40">📂</div>
          <p className="font-display text-xl mb-2" style={{ color: 'var(--color-text-muted)', fontWeight: 300 }}>
            Noch keine Partner-Datei geladen
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Klicken oder oben auf «Partner-Datei importieren»
          </p>
        </div>
      )}

      {/* ── Side-by-Side View ── */}
      {partnerData && view === 'side' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card px-4 py-4">
            <div className="name-badge mb-3">👤 {myData.name || 'Ich'}</div>
            <WeekScheduleGrid schedule={myData.schedule} readOnly label="" onScheduleChange={() => {}} selectedCat={null} />
          </div>
          <div className="card px-4 py-4">
            <div className="name-badge mb-3" style={{ background: '#e8edf5', color: '#546786' }}>
              👤 {partnerData.name || 'Partner/in'}
            </div>
            <WeekScheduleGrid schedule={partnerData.schedule} readOnly label="" onScheduleChange={() => {}} selectedCat={null} />
          </div>
        </div>
      )}

      {/* ── Heatmap Overlay ── */}
      {partnerData && view === 'heatmap' && (
        <HeatmapOverlay mySchedule={myData.schedule} partnerSchedule={partnerData.schedule} myName={myData.name} partnerName={partnerData.name} />
      )}

      {/* ── Priority Comparison ── */}
      {partnerData && view === 'priority' && (
        <PriorityComparison
          chartData={chartData}
          myName={myData.name}
          partnerName={partnerData.name}
          myHours={myHours}
          partnerHours={partnerHours}
          myPriorities={myData.priorities}
          partnerPriorities={partnerData.priorities}
        />
      )}

      {/* Legend always visible */}
      {partnerData && (
        <div className="card px-5 py-4">
          <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Legende</div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                <span className="text-xs" style={{ color: 'var(--color-text)', fontSize: 11 }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// HEATMAP OVERLAY
// ─────────────────────────────────────────────

function HeatmapOverlay({ mySchedule, partnerSchedule, myName, partnerName }) {
  const CELL_H = 11
  const COL_W  = 70

  function cellColor(myCat, partCat) {
    if (myCat === null && partCat === null) return '#f0f3f1'         // both free: light
    if (myCat === partCat && myCat !== null) {
      const cat = getCategoryById(myCat)
      return cat ? cat.color : '#ccc'                                // same activity: solid
    }
    if (myCat === null) {
      const cat = getCategoryById(partCat)
      return cat ? cat.color + '55' : '#ccc'                         // only partner: faded
    }
    if (partCat === null) {
      const cat = getCategoryById(myCat)
      return cat ? cat.color + '55' : '#ccc'                         // only me: faded
    }
    // Both busy but different: crosshatch via gradient
    const c1 = getCategoryById(myCat)?.color || '#aaa'
    const c2 = getCategoryById(partCat)?.color || '#bbb'
    return `${c1}`  // simplified: show mine
  }

  function cellTitle(myCat, partCat, slot) {
    const time = slotToTime(slot)
    const myStr   = myCat   ? getCategoryById(myCat)?.name   : 'frei'
    const partStr = partCat ? getCategoryById(partCat)?.name : 'frei'
    return `${time} — ${myName || 'Ich'}: ${myStr} | ${partnerName || 'Partner/in'}: ${partStr}`
  }

  // Compute free-time overlap stats
  let overlapFree = 0, onlyMeFree = 0, onlyPartnerFree = 0, bothBusy = 0
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 48; s++) {
      const m = mySchedule[d][s]
      const p = partnerSchedule[d][s]
      if (m === null && p === null) overlapFree++
      else if (m === null)          onlyMeFree++
      else if (p === null)          onlyPartnerFree++
      else                          bothBusy++
    }
  }

  const statCards = [
    { label: 'Gemeinsame Freizeit', val: (overlapFree * 0.5).toFixed(1) + 'h', color: '#7faa8d', sub: 'pro Woche' },
    { label: `Nur ${myName || 'Ich'} frei`, val: (onlyMeFree * 0.5).toFixed(1) + 'h', color: '#93a8c9', sub: 'pro Woche' },
    { label: `Nur ${partnerName || 'Partner/in'} frei`, val: (onlyPartnerFree * 0.5).toFixed(1) + 'h', color: '#c98d9a', sub: 'pro Woche' },
    { label: 'Beide beschäftigt', val: (bothBusy * 0.5).toFixed(1) + 'h', color: '#c8b97e', sub: 'pro Woche' },
  ]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="card px-4 py-3 text-center">
            <div className="font-display text-2xl mb-0.5" style={{ color: s.color, fontWeight: 500 }}>{s.val}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text)', fontSize: 11 }}>{s.label}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Overlay key */}
      <div className="card px-5 py-3 flex items-center gap-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="font-medium" style={{ color: 'var(--color-text)' }}>Überlagerungs-Legende:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm border" style={{ background: '#f0f3f1', borderColor: 'var(--color-border)' }} />
          Beide frei
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm" style={{ background: '#7faa8d' }} />
          Gleiche Aktivität
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm" style={{ background: '#7faa8d55' }} />
          Nur eine Person
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm" style={{ background: 'linear-gradient(135deg, #93a8c9 50%, #c98d9a 50%)' }} />
          Verschiedene Aktivität
        </span>
      </div>

      {/* Combined heatmap grid */}
      <div className="card px-5 py-5 overflow-auto">
        <div className="flex">
          <div className="flex-shrink-0" style={{ width: 44 }}>
            <div style={{ height: 28 }} />
            {Array.from({ length: 25 }, (_, h) => (
              <div
                key={h}
                className="text-right pr-2"
                style={{
                  height: CELL_H * 2,
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  lineHeight: `${CELL_H * 2}px`,
                  fontFamily: "'Source Sans 3', sans-serif",
                  marginTop: h === 0 ? 0 : 0,
                }}
              >
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex-shrink-0" style={{ width: COL_W }}>
              <div
                className="text-center font-medium pb-1 border-b"
                style={{ height: 28, fontSize: 12, borderColor: 'var(--color-border)', paddingTop: 6, fontFamily: "'Source Sans 3', sans-serif", color: dayIdx >= 5 ? 'var(--color-sage)' : 'var(--color-text)' }}
              >
                {day}
              </div>
              <div>
                {Array.from({ length: SLOTS_PER_DAY }, (_, slotIdx) => {
                  const mc = mySchedule[dayIdx][slotIdx]
                  const pc = partnerSchedule[dayIdx][slotIdx]
                  const bg = cellColor(mc, pc)
                  const isHour = slotIdx % 2 === 0
                  return (
                    <div
                      key={slotIdx}
                      className="heatmap-cell tooltip"
                      data-tip={cellTitle(mc, pc, slotIdx)}
                      style={{
                        height: CELL_H,
                        background: bg,
                        borderTop: isHour ? '1px solid rgba(0,0,0,0.05)' : 'none',
                        margin: '0 2px',
                        borderRadius: 2,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PRIORITY COMPARISON
// ─────────────────────────────────────────────

function PriorityComparison({ chartData, myName, partnerName, myHours, partnerHours, myPriorities, partnerPriorities }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    const item = chartData.find(d => d.name === label) || {}
    return (
      <div className="card p-3 text-xs" style={{ maxWidth: 200 }}>
        <div className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>{item.fullName || label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{p.value}h</span>
          </div>
        ))}
      </div>
    )
  }

  const PriorityTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    const item = chartData.find(d => d.name === label) || {}
    return (
      <div className="card p-3 text-xs">
        <div className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>{item.fullName || label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{p.value}/10</span>
          </div>
        ))}
      </div>
    )
  }

  // Find biggest gaps between the two people
  const gaps = CATEGORIES.map(cat => ({
    cat,
    timeDiff: Math.abs(myHours[cat.id] - partnerHours[cat.id]),
    prioDiff: Math.abs(myPriorities[cat.id] - partnerPriorities[cat.id]),
    myMore:   myHours[cat.id] > partnerHours[cat.id],
    myPrioMore: myPriorities[cat.id] > partnerPriorities[cat.id],
  })).sort((a, b) => b.timeDiff - a.timeDiff)

  return (
    <div className="space-y-4">
      {/* Biggest discrepancies */}
      <div className="card px-5 py-5">
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--color-text)' }}>
          Größte Zeitdifferenzen zwischen beiden Personen
        </div>
        <div className="space-y-2">
          {gaps.slice(0, 5).map(g => (
            <div key={g.cat.id} className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 mt-0.5" style={{ background: g.cat.color }} />
              <span className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{g.cat.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: g.cat.color + '25', color: g.cat.color, fontWeight: 600 }}>
                Δ {g.timeDiff.toFixed(1)}h
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {g.myMore ? `${myName || 'Ich'} verbringt mehr Zeit damit` : `${partnerName || 'Partner/in'} verbringt mehr Zeit damit`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time comparison chart */}
      <div className="card px-5 py-5">
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--color-text)' }}>Zeitverwendung: Wochenstunden im Vergleich</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fontFamily: "'Source Sans 3', sans-serif", fill: 'var(--color-text-muted)' }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "'Source Sans 3', sans-serif", fill: 'var(--color-text-muted)' }}
              tickFormatter={v => `${v}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif" }}
              formatter={(value) => value}
            />
            <Bar dataKey="mich" name={myName || 'Ich'} fill="#7faa8d" radius={[3, 3, 0, 0]} />
            <Bar dataKey="partner" name={partnerName || 'Partner/in'} fill="#93a8c9" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority comparison chart */}
      <div className="card px-5 py-5">
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--color-text)' }}>Prioritätswerte im Vergleich (1–10)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fontFamily: "'Source Sans 3', sans-serif", fill: 'var(--color-text-muted)' }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 10, fontFamily: "'Source Sans 3', sans-serif", fill: 'var(--color-text-muted)' }}
            />
            <Tooltip content={<PriorityTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif" }}
            />
            <Bar dataKey="meinP" name={myName || 'Ich'} fill="#c98d9a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="partnerP" name={partnerName || 'Partner/in'} fill="#daa85a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// EXPORT / IMPORT BANNER
// ─────────────────────────────────────────────

function ExportImportPanel({ myData, onImport }) {
  const importRef = useRef(null)

  function exportData() {
    const blob = new Blob([JSON.stringify(myData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const name = (myData.name || 'person').replace(/\s+/g, '_').toLowerCase()
    a.href     = url
    a.download = `vogt-coaching_${name}_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.schedule && data.priorities) {
          if (window.confirm('Eigene Daten durch Import ersetzen?')) {
            onImport(data)
          }
        } else {
          alert('Ungültiges Dateiformat.')
        }
      } catch {
        alert('Datei konnte nicht gelesen werden.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="font-medium" style={{ color: 'var(--color-text)' }}>Datenaustausch:</span>{' '}
        Exportieren Sie Ihre Daten und senden Sie die JSON-Datei an Ihre Partnerin / Ihren Partner.
      </div>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      <button onClick={() => importRef.current?.click()} className="btn-secondary text-xs whitespace-nowrap py-1.5 px-3">
        ↑ Eigene Daten importieren
      </button>
      <button onClick={exportData} className="btn-primary text-xs whitespace-nowrap py-1.5 px-3">
        ↓ Meine Daten exportieren
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(0)
  const [personName, setPersonName] = useState('')
  const [schedule, setSchedule]     = useState(createEmptySchedule)
  const [priorities, setPriorities] = useState(createDefaultPriorities)
  const [partnerData, setPartnerData] = useState(null)

  const myData = { name: personName, schedule, priorities }

  function updatePriority(catId, value) {
    setPriorities(prev => ({ ...prev, [catId]: value }))
  }

  function importMyData(data) {
    if (data.name)       setPersonName(data.name)
    if (data.schedule)   setSchedule(data.schedule)
    if (data.priorities) setPriorities(data.priorities)
  }

  function handleNextStep() {
    if (step < 2) setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Header personName={personName} step={step} onNameChange={setPersonName} />
      <StepIndicator step={step} onStep={setStep} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Export/Import row */}
        <div className="mb-6">
          <ExportImportPanel myData={myData} onImport={importMyData} />
        </div>

        {/* Step content */}
        {step === 0 && (
          <ScheduleStep
            schedule={schedule}
            onScheduleChange={setSchedule}
            personName={personName}
          />
        )}
        {step === 1 && (
          <PriorityStep
            priorities={priorities}
            onPriorityChange={updatePriority}
            schedule={schedule}
          />
        )}
        {step === 2 && (
          <ComparisonStep
            myData={myData}
            partnerData={partnerData}
            setPartnerData={setPartnerData}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className="btn-secondary"
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}
          >
            ← Zurück
          </button>

          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  background: i === step ? 'var(--color-sage)' : i < step ? 'var(--color-sage-light)' : 'var(--color-border)',
                }}
              />
            ))}
          </div>

          {step < 2 ? (
            <button onClick={handleNextStep} className="btn-primary">
              Weiter →
            </button>
          ) : (
            <div className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Schritt 3 von 3</div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', marginTop: 48 }}>
        <span className="font-display" style={{ fontSize: 14, color: 'var(--color-text)' }}>Vogt-Coaching</span>
        <span className="mx-2">·</span>
        Alle Daten verbleiben ausschließlich auf Ihrem Gerät
        <span className="mx-2">·</span>
        Kein Server · Keine Datenübertragung
      </footer>
    </div>
  )
}
