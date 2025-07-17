import React, { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../../theme/ThemeContext';

const PRESETS = [
  { label: 'last 7 days', days: 7 },
  { label: 'last 14 days', days: 14 },
  { label: 'last 30 days', days: 30 },
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
    label: `${days} last days`,
  };
}

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(value?.start || '');
  const [customEnd, setCustomEnd] = useState(value?.end || '');
  const [customError, setCustomError] = useState('');
  const ref = useRef();

  // Ajout détection mode sombre via contexte
  const { isLight } = useContext(ThemeContext);
  const isDark = !isLight;

  // Validation des dates personnalisées
  useEffect(() => {
    if (!customStart || !customEnd) {
      setCustomError('');
      return;
    }
    if (customEnd < customStart) {
      setCustomError('The end date must be later than or equal to the start date.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (customStart > today || customEnd > today) {
      setCustomError('Dates cannot be in the future.');
      return;
    }
    setCustomError('');
  }, [customStart, customEnd]);

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
    if (customStart && customEnd && !customError) {
      onChange({
        start: customStart,
        end: customEnd,
        label: `Du ${formatDate(customStart)} au ${formatDate(customEnd)}`
      });
      setOpen(false);
      setShowCustom(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth: 180 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 180,
          padding: '6px 10px',
          borderRadius: 8,
          border: isDark ? '1px solid #B5A2D8' : '1px solid #817EE1',
          background: isDark ? '#4C386F' : '#fff',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: 'none',
        }}
      >
        <span style={{ fontSize: 14, color: isDark ? '#fff' : '#222' }}>
          {value?.label || `${formatDate(value?.start)} – ${formatDate(value?.end)}`}
          <span style={{ display: 'block', fontWeight: 400, fontSize: 11, color: isDark ? '#fff' : '#666' }}>
            {formatDate(value?.start)} – {formatDate(value?.end)}
          </span>
        </span>
        <span style={{ marginLeft: 8, fontSize: 15, color: isDark ? '#B5A2D8' : '#817EE1' }}>▼</span>
      </button>
      {open && (
        <div
          className="date-range-picker-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            minWidth: 200,
            padding: 0,
            marginTop: 0,
          }}
        >
          <div style={{ padding: '12px 0 0 0', fontWeight: 700, fontSize: 12, color: isDark ? '#B5A2D8' : '#817EE1', paddingLeft: 14, letterSpacing: 1 }}>
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
                  background: selected ? (isDark ? '#675191' : 'rgba(129,126,225,0.13)') : 'transparent',
                  color: isDark ? '#fff' : '#222',
                  border: 'none',
                  boxShadow: 'none',
                  fontWeight: selected ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                  borderRadius: 0,
                  overflow: 'hidden',
                  borderLeft: selected ? (isDark ? '3px solid #B5A2D8' : '3px solid #817EE1') : '3px solid transparent',
                  marginBottom: 0,
                }}
              >
                <div style={{ color: isDark ? '#fff' : '#222' }}>{preset.label}</div>
                <div style={{ fontSize: 11, color: isDark ? '#fff' : '#666', fontWeight: 400 }}>
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
              background: showCustom ? (isDark ? '#675191' : 'rgba(129,126,225,0.13)') : 'transparent',
              color: isDark ? '#fff' : '#817EE1',
              border: 'none',
              boxShadow: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: 0,
              overflow: 'hidden',
              borderLeft: showCustom ? (isDark ? '3px solid #B5A2D8' : '3px solid #817EE1') : '3px solid transparent',
              marginBottom: 0,
            }}
          >
            Custom period
          </button>
          {showCustom && (
            <div style={{ padding: '12px 14px', borderTop: isDark ? '1px solid #B5A2D8' : '1px solid #eee', background: isDark ? '#4C386F' : '#f8f8fb' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#fff' }}>
                  Beginning :
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ marginLeft: 6 }} max={today} />
                </label>
                <label style={{ fontSize: 12, color: '#fff' }}>
                  End :
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ marginLeft: 6 }} max={today} />
                </label>
                <button
                  onClick={handleCustom}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 7,
                    border: '1px solid #B5A2D8',
                    background: '#B5A2D8',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: 10
                  }}
                  disabled={!customStart || !customEnd || !!customError}
                >
                  Apply
                </button>
              </div>
              {customError && (
                <div style={{ color: '#FF3F52', fontSize: 12, marginTop: 2, fontWeight: 600 }}>{customError}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 