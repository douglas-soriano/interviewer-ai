"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VOLUME_THRESHOLD = 0.02;
const LEVEL_EMIT_MS = 55;

export type VoiceStartResult =
  | { ok: true }
  | { ok: false; message: string };

export interface VoiceRecording {
  url: string;
  durationMs: number;
}

export interface VoiceCapture {
  transcript: string;
  interim: string;
  isRecording: boolean;
  volumeOk: boolean;
  level: number;
  supported: boolean;
  error: string | null;
  start: () => Promise<VoiceStartResult>;
  stop: () => void;
  reset: () => void;
  getTranscript: () => string;
  takeRecording: () => Promise<VoiceRecording | null>;
}

export function useVoiceCapture(): VoiceCapture {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [volumeOk, setVolumeOk] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastEmitRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const recorderStoppedRef = useRef<Promise<void> | null>(null);
  const recordingStartedAtRef = useRef(0);

  useEffect(() => {
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;
    if (!Ctor) setSupported(false);
  }, []);

  const teardownAudio = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    interimRef.current = "";
    lastEmitRef.current = 0;
    setTranscript("");
    setInterim("");
    setVolumeOk(false);
    setLevel(0);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Some browsers throw when stop races with their own end event.
    }
    recognitionRef.current = null;

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // Recorder may already be stopping.
      }
    }

    teardownAudio();
    setIsRecording(false);
    setLevel(0);
  }, [teardownAudio]);

  const takeRecording = useCallback(async (): Promise<VoiceRecording | null> => {
    if (recorderStoppedRef.current) {
      await recorderStoppedRef.current.catch(() => undefined);
    }

    recorderRef.current = null;
    const chunks = recorderChunksRef.current;
    recorderChunksRef.current = [];

    if (chunks.length === 0) return null;

    const blob = new Blob(chunks, { type: chunks[0].type || "audio/webm" });
    if (blob.size === 0) return null;

    return {
      url: URL.createObjectURL(blob),
      durationMs: Math.max(0, performance.now() - recordingStartedAtRef.current),
    };
  }, []);

  const getTranscript = useCallback(
    () => `${finalRef.current} ${interimRef.current}`.trim(),
    [],
  );

  const start = useCallback(async (): Promise<VoiceStartResult> => {
    reset();

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      const message = "Speech recognition is not supported in this browser.";
      setSupported(false);
      setError(message);
      return { ok: false, message };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const measure = () => {
        analyser.getByteTimeDomainData(data);

        let sumSquares = 0;
        for (let index = 0; index < data.length; index += 1) {
          const value = (data[index] - 128) / 128;
          sumSquares += value * value;
        }

        const rms = Math.sqrt(sumSquares / data.length);
        if (rms > VOLUME_THRESHOLD) setVolumeOk(true);

        const now = performance.now();
        if (now - lastEmitRef.current >= LEVEL_EMIT_MS) {
          lastEmitRef.current = now;
          setLevel(Math.min(1, rms * 6));
        }

        rafRef.current = requestAnimationFrame(measure);
      };
      measure();

      recorderChunksRef.current = [];
      recorderStoppedRef.current = null;

      if (typeof MediaRecorder !== "undefined") {
        try {
          const recorder = new MediaRecorder(stream);
          recorderRef.current = recorder;
          recordingStartedAtRef.current = performance.now();
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recorderChunksRef.current.push(event.data);
            }
          };
          recorderStoppedRef.current = new Promise((resolve) => {
            recorder.onstop = () => resolve();
            recorder.onerror = () => resolve();
          });
          recorder.start();
        } catch {
          recorderRef.current = null;
        }
      }
    } catch {
      teardownAudio();
      const message = "Microphone access was denied.";
      setError(message);
      return { ok: false, message };
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalRef.current += `${text} `;
        } else {
          interimText += text;
        }
      }

      interimRef.current = interimText;
      setTranscript(finalRef.current.trim());
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
      return { ok: true };
    } catch {
      teardownAudio();
      recognitionRef.current = null;
      const message = "Speech recognition could not start.";
      setError(message);
      return { ok: false, message };
    }
  }, [reset, teardownAudio]);

  useEffect(() => () => stop(), [stop]);

  return {
    transcript,
    interim,
    isRecording,
    volumeOk,
    level,
    supported,
    error,
    start,
    stop,
    reset,
    getTranscript,
    takeRecording,
  };
}
