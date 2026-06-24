import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db.js';
import { uid, dk } from '../../lib/date.js';
import { DAYS_NL, MONTHS_NL, MOODS } from '../../lib/constants.js';

function fmtDay(str) {
  const d = new Date(str + 'T12:00:00');
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}

function parseTags(str) {
  return str.split(',').map(t => t.trim()).filter(Boolean);
}

export default function LogbookView() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newMood, setNewMood] = useState('');
  const [editing, setEditing] = useState(null);

  const logEntriesRaw = useLiveQuery(() => db.logEntries.orderBy('date').reverse().toArray());
  const dayNotesRaw = useLiveQuery(() => db.days.filter(d => !!d.notes).toArray());

  const allEntries = useMemo(() => {
    if (!logEntriesRaw || !dayNotesRaw) return [];
    const log = logEntriesRaw.map(e => ({ ...e, _type: 'log' }));
    const days = dayNotesRaw.map(d => ({
      id: `day_${d.date}`,
      date: d.date,
      body: d.notes,
      tags: [],
      mood: d.mood || null,
      _type: 'day',
    }));
    return [...log, ...days].sort((a, b) => b.date.localeCompare(a.date));
  }, [logEntriesRaw, dayNotesRaw]);

  const allTags = useMemo(() => {
    if (!logEntriesRaw) return [];
    const s = new Set();
    logEntriesRaw.forEach(e => e.tags?.forEach(t => s.add(t)));
    return [...s].sort();
  }, [logEntriesRaw]);

  const filtered = useMemo(() => {
    let list = allEntries;
    if (activeTag) list = list.filter(e => e.tags?.includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.body?.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allEntries, search, activeTag]);

  const addEntry = async () => {
    if (!newBody.trim()) return;
    await db.logEntries.put({
      id: uid(),
      date: dk(new Date()),
      body: newBody.trim(),
      tags: parseTags(newTags),
      mood: newMood || null,
      createdAt: new Date().toISOString(),
    });
    setNewBody(''); setNewTags(''); setNewMood(''); setShowForm(false);
  };

  const startEdit = (entry) => {
    setEditing({ ...entry, tagsStr: entry.tags?.join(', ') || '' });
    setShowForm(false);
  };

  const saveEdit = async () => {
    if (editing._type === 'log') {
      await db.logEntries.update(editing.id, {
        body: editing.body,
        tags: parseTags(editing.tagsStr),
        mood: editing.mood,
      });
    } else {
      await db.days.update(editing.date, { notes: editing.body });
    }
    setEditing(null);
  };

  const deleteEntry = async (entry) => {
    if (!confirm('Verwijderen?')) return;
    if (entry._type === 'log') {
      await db.logEntries.delete(entry.id);
    } else {
      await db.days.update(entry.date, { notes: '' });
    }
  };

  const moodEmoji = (val) => MOODS.find(m => m.value === val)?.emoji;

  const cardBase = { background: 'var(--card)', borderRadius: 12, padding: 14, marginBottom: 8, boxShadow: '0 1px 3px var(--shadow)' };
  const btnBase = { padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' };
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)', outline: 'none' };

  return (
    <div style={{ padding: '14px 12px 24px', animation: 'fadeUp .3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 700, flex: 1 }}>📖 Logboek</h2>
        <button onClick={() => { setShowForm(f => !f); setEditing(null); }} style={{
          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          background: showForm ? 'var(--border-soft)' : '#059669',
          color: showForm ? 'var(--text)' : 'white',
        }}>
          {showForm ? 'Annuleer' : '+ Nieuw'}
        </button>
      </div>

      {/* Nieuw entry formulier */}
      {showForm && (
        <div style={cardBase}>
          <textarea
            value={newBody} onChange={e => setNewBody(e.target.value)}
            placeholder="Schrijf iets..." rows={4} autoFocus
            style={{ ...inputStyle, lineHeight: 1.6, resize: 'vertical', minHeight: 90 }}
          />
          <input
            value={newTags} onChange={e => setNewTags(e.target.value)}
            placeholder="Tags (komma-gescheiden: werk, focus, gezondheid)"
            style={{ ...inputStyle, marginTop: 8 }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 10, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setNewMood(newMood === m.value ? '' : m.value)} style={{
                  padding: '3px 8px', borderRadius: 7, fontSize: 15, cursor: 'pointer',
                  border: newMood === m.value ? '2px solid #059669' : '1.5px solid var(--border)',
                  background: newMood === m.value ? 'var(--sel-bg)' : 'var(--card)',
                }}>{m.emoji}</button>
              ))}
            </div>
            <button onClick={addEntry} disabled={!newBody.trim()} style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#059669', color: 'white', fontSize: 12, fontWeight: 700,
              opacity: newBody.trim() ? 1 : 0.4,
            }}>Opslaan</button>
          </div>
        </div>
      )}

      {/* Zoekbalk */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Zoek in tekst of tags..."
          style={{ ...inputStyle, paddingLeft: 32 }}
        />
      </div>

      {/* Tag-filter */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTag === tag ? '#059669' : 'var(--border-soft)',
              color: activeTag === tag ? 'white' : 'var(--text-muted)',
            }}>#{tag}</button>
          ))}
        </div>
      )}

      {/* Leeg scherm */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
          <p style={{ fontSize: 32, marginBottom: 6 }}>📭</p>
          <p style={{ fontSize: 12 }}>
            {search || activeTag ? 'Geen resultaten.' : 'Nog niets geschreven — druk op + Nieuw of schrijf een notitie in de tracker.'}
          </p>
        </div>
      )}

      {/* Entry-kaarten */}
      {filtered.map(entry => (
        <div key={entry.id} style={cardBase}>
          {editing?.id === entry.id ? (
            <div>
              <textarea
                value={editing.body} onChange={e => setEditing(ed => ({ ...ed, body: e.target.value }))}
                rows={4} autoFocus
                style={{ ...inputStyle, lineHeight: 1.6, resize: 'vertical', minHeight: 80, borderColor: '#059669' }}
              />
              {editing._type === 'log' && (
                <input
                  value={editing.tagsStr}
                  onChange={e => setEditing(ed => ({ ...ed, tagsStr: e.target.value }))}
                  placeholder="Tags (komma-gescheiden)"
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(null)} style={{ ...btnBase, padding: '6px 12px' }}>Annuleer</button>
                <button onClick={saveEdit} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#059669', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Opslaan</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{fmtDay(entry.date)}</span>
                  {entry._type === 'day' && (
                    <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 99, background: 'var(--border-soft)', color: 'var(--text-faint)', fontWeight: 600 }}>Dagnotitie</span>
                  )}
                  {entry.mood && <span style={{ fontSize: 13 }}>{moodEmoji(entry.mood)}</span>}
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => startEdit(entry)} style={btnBase}>✏️</button>
                  <button onClick={() => deleteEntry(entry)} style={btnBase}>🗑️</button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{entry.body}</p>
              {entry.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                  {entry.tags.map(tag => (
                    <span key={tag} onClick={() => setActiveTag(tag)} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 99, cursor: 'pointer',
                      background: 'var(--border-soft)', color: 'var(--text-muted)', fontWeight: 600,
                    }}>#{tag}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
