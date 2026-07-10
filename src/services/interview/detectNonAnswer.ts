const NON_ANSWER_PATTERNS: RegExp[] = [
  /^\s*(i\s+)?(really\s+)?(do\s*n'?t|do not)\s+know/i,
  /^\s*(i\s+)?(have\s+)?no\s+(idea|clue|answer)/i,
  /^\s*(i'?m\s+)?not\s+sure/i,
  /^\s*(i\s+)?can'?t\s+(answer|say|think)/i,
  /^\s*(i\s+)?(don'?t|do not)\s+(have|remember)/i,
  /^\s*(no|nope|pass|skip|dunno|idk)\s*[.!]?\s*$/i,
];

const MIN_WORDS = 4;

export function isNonAnswer(transcript: string): boolean {
  const text = transcript.trim();

  if (text.length === 0) {
    return true;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) {
    return true;
  }

  return NON_ANSWER_PATTERNS.some((pattern) => pattern.test(text));
}
