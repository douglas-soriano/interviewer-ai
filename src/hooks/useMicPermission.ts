"use client";

import { useCallback, useEffect, useState } from "react";

export type MicPermissionState =
  | "checking"
  | "granted"
  | "denied"
  | "unsupported";

export function useMicPermission(): {
  state: MicPermissionState;
  retry: () => void;
} {
  const [state, setState] = useState<MicPermissionState>("checking");

  const request = useCallback(async () => {
    setState("checking");

    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setState("granted");
    } catch {
      setState("denied");
    }
  }, []);

  useEffect(() => {
    void request();
  }, [request]);

  return { state, retry: request };
}
