const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any |the )?(previous|prior|above|your) (instructions|prompts?|rules)/i,
  /disregard (the |your )?(instructions|rules|rubric)/i,
  /\byou are now\b/i,
  /\bnew instructions?\b/i,
  /\bsystem prompt\b/i,
  /(give|award|assign) (me )?(a )?(full|max(imum)?|perfect|top|highest) (marks?|score|rating|grade)/i,
  /rate me (a |as )?(10|100|max)/i,
  /pass me (regardless|no matter)/i,
  /pretend (to be|you are)/i,
  /act as (an?|the) (admin|developer|system)/i,
];

export interface ManipulationCheck {
  suspected: boolean;
  note: string | null;
}

export function detectManipulation(transcript: string): ManipulationCheck {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(transcript)) {
      return {
        suspected: true,
        note: "Answer contains directive-like content aimed at the interviewer.",
      };
    }
  }

  return { suspected: false, note: null };
}
