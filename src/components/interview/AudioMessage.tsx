"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, CaretUp, Pause, Play } from "@phosphor-icons/react";

function formatTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.floor(safeSeconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function AudioMessage({
  url,
  durationMs,
  transcript,
}: {
  url: string;
  durationMs: number;
  transcript: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const durationSec = durationMs / 1000;

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleTime = () => setPosition(audio.currentTime);
    const handleEnded = () => {
      setPlaying(false);
      setPosition(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [url]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setPosition(value);
  };

  const progress = durationSec > 0 ? Math.min(1, position / durationSec) : 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? "Pause answer audio" : "Play answer audio"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-mic)] text-white shadow-[0_6px_14px_rgb(83_72_239/0.22)] transition active:scale-95"
        >
          {playing ? (
            <Pause size={17} weight="fill" aria-hidden />
          ) : (
            <Play size={17} weight="fill" aria-hidden />
          )}
        </button>

        <div className="min-w-[180px] flex-1">
          <input
            type="range"
            min={0}
            max={durationSec || 1}
            step={0.1}
            value={position}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek answer audio"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--primary)]"
            style={{
              background: `linear-gradient(to right, var(--primary) ${
                progress * 100
              }%, var(--meter-empty) ${progress * 100}%)`,
            }}
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-[var(--text-muted)]">
            <span>{formatTime(position)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowTranscript((value) => !value)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
        aria-expanded={showTranscript}
      >
        {showTranscript ? "Hide transcript" : "View transcript"}
        {showTranscript ? (
          <CaretUp size={13} aria-hidden />
        ) : (
          <CaretDown size={13} aria-hidden />
        )}
      </button>

      {showTranscript && (
        <p className="mt-2 whitespace-pre-wrap border-l-2 border-[#d9d8fa] pl-3 text-sm leading-6 text-[var(--text-secondary)]">
          {transcript}
        </p>
      )}
    </div>
  );
}
