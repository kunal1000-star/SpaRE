import React, { useState } from 'react';
import { BookOpen, ExternalLink, GraduationCap, Zap, Rocket, Globe, FileText, Cpu, ChevronDown } from 'lucide-react';
import { getPaletteColorForName, getCategoryMeta } from '../types';

/**
 * Parses track-prefixed notes string into structured track boxes dynamically.
 * Shortest unique prefixes (c., g., n., am., ap., s., etc.) automatically 
 * resolve into dynamic track boxes using the 25-color non-conflicting palette.
 */
export function parseNotesToTracks(notesText, customCategories = {}) {
  if (!notesText || typeof notesText !== 'string') return [];

  const lines = notesText.split('\n');
  const tracks = [];
  let currentTrack = null;

  const getTrackMeta = (prefix) => {
    const raw = prefix.toLowerCase().replace(/[:.]/g, '').trim();
    let trackName = raw;
    let icon = FileText;

    if (raw === 'c' || raw.includes('college')) {
      trackName = 'College Track';
      icon = GraduationCap;
    } else if (raw === 'g' || raw.includes('gate')) {
      trackName = 'GATE Track';
      icon = Zap;
    } else if (raw === 'n' || raw.includes('nvidia')) {
      trackName = 'Nvidia Track';
      icon = Rocket;
    } else if (raw === 'am' || raw.includes('amd')) {
      trackName = 'AMD Track';
      icon = Cpu;
    } else if (raw === 'ap' || raw.includes('apple')) {
      trackName = 'Apple Track';
      icon = Rocket;
    } else if (raw === 's' || raw.includes('self')) {
      trackName = 'Self Study';
      icon = Globe;
    } else {
      trackName = `${raw.toUpperCase()} Track`;
    }

    const palette = getPaletteColorForName(trackName);

    return {
      id: raw,
      name: trackName,
      icon,
      color: palette.id,
      bg: palette.bgLight,
      border: palette.borderColor,
      text: palette.accentColor,
      badgeBg: palette.badgeBg,
    };
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for prefix patterns:
    // e.g. "c. -nice", "c. nice", "c - nice", "c:", "am.", "ap.", "g.", "n.", "college:", "amd: some text", "🎓 College: some text"
    const prefixMatch = 
      trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]{0,14})\s*(?:[:.]|\s+[-–—])\s*(.*)$/) ||
      trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]{0,14})[.:]\s*(.*)$/) ||
      trimmed.match(/^([\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF]+[a-zA-Z0-9\s]*)[.:]\s*(.*)$/);

    if (prefixMatch) {
      const prefixCandidate = prefixMatch[1];
      const remainder = prefixMatch[2]?.trim();

      // Check if prefixCandidate is a valid track prefix (letters or emoji, length <= 15)
      const cleanCandidate = prefixCandidate.replace(/[:.]/g, '').trim();
      const isPrefix = /^[a-zA-Z][a-zA-Z0-9_-]{0,14}$/.test(cleanCandidate) ||
        trimmed.startsWith('🎓') || trimmed.startsWith('⚡') || trimmed.startsWith('🚀') || trimmed.startsWith('🌐') || trimmed.startsWith('🔗');

      if (isPrefix) {
        currentTrack = {
          meta: getTrackMeta(prefixCandidate),
          items: []
        };
        tracks.push(currentTrack);

        if (remainder) {
          // If remainder starts with dash/bullet, strip it for clean item formatting
          const cleanItem = remainder.replace(/^[-*•]\s*/, '').trim();
          if (cleanItem) currentTrack.items.push(cleanItem);
        }
        continue;
      }
    }

    // Line is an item / bullet under current track (or general if no track started yet)
    if (!currentTrack) {
      currentTrack = {
        meta: {
          id: 'general',
          name: 'Notes',
          icon: BookOpen,
          color: 'slate',
          bg: 'bg-white/[0.02]',
          border: 'border-white/[0.06]',
          text: 'text-slate-300',
          badgeBg: 'bg-white/[0.05] text-slate-300 border-white/10'
        },
        items: []
      };
      tracks.push(currentTrack);
    }

    // Clean bullet symbols (- or * or •)
    const cleanItem = trimmed.replace(/^[-*•]\s*/, '').trim();
    if (cleanItem) {
      currentTrack.items.push(cleanItem);
    }
  }

  return tracks;
}

/**
 * Helper to render inline text with clickable Notion / web links
 */
export function RenderLineWithLinks({ text }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.match(urlRegex)) {
          const isNotion = part.includes('notion.so') || part.includes('notion.site');
          return (
            <a
              key={idx}
              href={part}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center space-x-0.5 font-medium ml-1 mr-1"
            >
              <span>{isNotion ? 'Notion Notes' : part.length > 25 ? `${part.slice(0, 22)}...` : part}</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5 shrink-0 inline" />
            </a>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

/**
 * TrackNotesView Component
 * Renders parsed notes into beautiful multi-track boxes with bullet points.
 * Each track box is collapsible and collapsed by default so topic cards stay compact.
 */
export default function TrackNotesView({ notes, compact = false, collapsible = true, defaultExpanded = false }) {
  if (!notes || !notes.trim()) return null;

  const tracks = parseNotesToTracks(notes);
  if (tracks.length === 0) return null;

  return (
    <div className={`space-y-2 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      {tracks.map((track, tIdx) => (
        <TrackNoteBox
          key={tIdx}
          track={track}
          collapsible={collapsible}
          defaultExpanded={defaultExpanded}
        />
      ))}
    </div>
  );
}

function TrackNoteBox({ track, collapsible, defaultExpanded }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const Icon = track.meta.icon;
  const showItems = !collapsible || isOpen;

  const dotColor =
    track.meta.id === 'college' || track.meta.id === 'c' ? 'bg-sky-400' :
    track.meta.id === 'gate' || track.meta.id === 'g' ? 'bg-amber-400' :
    track.meta.id === 'nvidia' || track.meta.id === 'n' ? 'bg-emerald-400' :
    track.meta.id === 'amd' || track.meta.id === 'am' ? 'bg-rose-400' :
    'bg-slate-400';

  const header = (
    <>
      <div className="flex items-center space-x-1.5 min-w-0">
        <Icon className={`w-3.5 h-3.5 ${track.meta.text} shrink-0`} />
        <span className={`font-bold tracking-tight truncate ${track.meta.text}`}>
          {track.meta.name}
        </span>
      </div>
      <div className="flex items-center space-x-1.5 shrink-0">
        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${track.meta.badgeBg}`}>
          {track.items.length} {track.items.length === 1 ? 'point' : 'points'}
        </span>
        {collapsible && (
          <ChevronDown
            className={`w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>
    </>
  );

  return (
    <div
      className={`rounded-xl border ${track.meta.bg} ${track.meta.border} transition-all ${showItems ? 'p-2.5 space-y-1.5' : 'px-2.5 py-2'}`}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer"
        >
          {header}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2">
          {header}
        </div>
      )}

      {/* Bulleted Points */}
      {showItems && (
        <div className="space-y-1 pl-1 animate-fade-in">
          {track.items.map((item, iIdx) => (
            <div key={iIdx} className="flex items-start space-x-2 text-slate-200 leading-relaxed">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
              <span className="flex-1">
                <RenderLineWithLinks text={item} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
