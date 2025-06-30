import React, { useState, useRef, useEffect } from 'react';

const PRESETS = [
  { label: '7 derniers jours', days: 7 },
  { label: '14 derniers jours', days: 14 },
  { label: '30 derniers jours', days: 30 },
];

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
}

function getPresetRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `${days} derniers jours`,
  };
}

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(value?.start || '');
  const [customEnd, setCustomEnd] = useState(value?.end || '');
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handlePreset = (days, label) => {
    const range = getPresetRange(days);
    onChange(range);
    setOpen(false);
    setShowCustom(false);
  };

  const handleCustom = () => {
    if (customStart && customEnd) {
      onChange({
        start: customStart,
        end: customEnd,
        label: `Du ${formatDate(customStart)} au ${formatDate(customEnd)}`
      });
      setOpen(false);
      setShowCustom(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth: 180 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 180,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #817EE1',
          background: '#fff',
          color: '#817EE1',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: open ? '0 4px 24px rgba(129,126,225,0.10)' : 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>
          {value?.label || `${formatDate(value?.start)} – ${formatDate(value?.end)}`}
          <span style={{ display: 'block', fontWeight: 400, fontSize: 11, color: '#666' }}>
            {formatDate(value?.start)} – {formatDate(value?.end)}
          </span>
        </span>
        <span style={{ marginLeft: 8, fontSize: 15, color: '#817EE1' }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            minWidth: 200,
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(129,126,225,0.13)',
            padding: 0,
            marginTop: 0,
          }}
        >
          <div style={{ padding: '12px 0 0 0', fontWeight: 700, fontSize: 12, color: '#817EE1', paddingLeft: 14, letterSpacing: 1 }}>
            SÉLECTIONNER UNE PÉRIODE
          </div>
          {PRESETS.map(preset => {
            const range = getPresetRange(preset.days);
            const selected = value?.label === preset.label || (value?.start === range.start && value?.end === range.end);
            return (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset.days, preset.label)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 8px 10px 20px',
                  background: selected ? 'rgba(129,126,225,0.13)' : 'transparent',
                  color: selected ? '#817EE1' : '#222',
                  border: 'none',
                  fontWeight: selected ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                  borderRadius: 10,
                  overflow: 'hidden',
                  borderLeft: selected ? '3px solid #817EE1' : '3px solid transparent',
                  marginBottom: 0,
                }}
              >
                <div>{preset.label}</div>
                <div style={{ fontSize: 11, color: '#666', fontWeight: 400 }}>
                  {formatDate(range.start)} – {formatDate(range.end)}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setShowCustom(s => !s)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 8px 10px 20px',
              background: showCustom ? 'rgba(129,126,225,0.13)' : 'transparent',
              color: '#817EE1',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: 10,
              overflow: 'hidden',
              borderLeft: showCustom ? '3px solid #817EE1' : '3px solid transparent',
              marginBottom: 0,
            }}
          >
            Période personnalisée
          </button>
          {showCustom && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #eee', background: '#f8f8fb' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#666' }}>
                  Début :
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ marginLeft: 6 }} />
                </label>
                <label style={{ fontSize: 12, color: '#666' }}>
                  Fin :
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ marginLeft: 6 }} />
                </label>
                <button
                  onClick={handleCustom}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 7,
                    border: '1px solid #817EE1',
                    background: '#817EE1',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  disabled={!customStart || !customEnd}
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 