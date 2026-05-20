export interface ValidationResult {
  original: string;
  normalized: string;
  confidence: number;
  warning?: string;
  matchedType?: 'BGE' | 'Code Article' | 'Unknown';
}

function toRoman(numStr: string): string {
  const map: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI' };
  return map[numStr] || numStr.toUpperCase();
}

/**
 * Fuzzy matches and normalizes Swiss legal citations.
 */
export function validateAndNormalize(input: string): ValidationResult {
  const clean = input.trim();
  if (!clean) return { original: '', normalized: '', confidence: 0 };

  // 1. BGE Fuzzy Matcher (e.g., "BGE 145 III 63", "bge145iii63", "145 3 63")
  const bgeMatch = clean.match(/(?:bge|bget?)?[\s\.\-_]*(\d{2,3})[\s\.\-_]*((?:i{1,3}|iv|v|vi)|\d)[\s\.\-_]*(\d+)/i);
  if (bgeMatch && bgeMatch[0].length > clean.length * 0.4) {
     const vol = bgeMatch[1];
     const part = toRoman(bgeMatch[2]);
     const page = bgeMatch[3];
     const normalized = `BGE ${vol} ${part} ${page}`;

     const isPerfect = clean === normalized;
     const isVeryClose = clean.toLowerCase().replace(/\s/g, '') === normalized.toLowerCase().replace(/\s/g, '');
     
     // Base confidence heavily on whether BGE was explicitly mentioned
     const hasBgeTerm = clean.toLowerCase().includes('bge');
     let confidence = isPerfect ? 1.0 : (isVeryClose ? 0.95 : 0.80);
     if (!hasBgeTerm) confidence = 0.65; // Implicit match penalty

     let warning;
     if (confidence <= 0.85 && hasBgeTerm) {
         warning = `Ambiguous BGE formatting. Fuzzy matched volume ${vol}, part ${part}. Verify this wasn't an accidental collision.`;
     } else if (!hasBgeTerm) {
         warning = `Likely missing 'BGE' prefix. Implicit match from number pattern. Verify intended authority.`;
     }

     return { original: clean, normalized, confidence, warning, matchedType: 'BGE' };
  }

  // 2. Code Article Fuzzy Matcher (e.g., "art97or", "A 2 ZGB")
  const codes = "OR|ZGB|StGB|SchKG|BV|ZPO|BGG";
  const artMatch = clean.match(new RegExp(`(?:art\\.?|a\\.?|article)?[\\s\\.\\-_]*(\\d+[a-z]?)[\\s\\.\\-_]*(?:abs\\.?[\\s\\.\\-_]*\\d+[\\s\\.\\-_]*)?(${codes})`, 'i'));

  if (artMatch) {
     const num = artMatch[1];
     const code = artMatch[2].toUpperCase();
     const normalized = `Art. ${num} ${code}`;

     const isPerfect = clean === normalized;
     const isClose = clean.toLowerCase().replace(/[\s\.]/g, '') === normalized.toLowerCase().replace(/[\s\.]/g, '');
     const hasArtTerm = /(art|article|a\.)/i.test(clean);
     
     let confidence = isPerfect ? 1.0 : (isClose ? 0.92 : 0.75);
     if (!hasArtTerm) confidence -= 0.15; // Penalty if "Art" is completely missing

     let warning;
     if (confidence <= 0.75) {
         if (!hasArtTerm) {
             warning = "Likely missing 'Art.' prefix. Formatting reconstructed heavily. Verify exact article number and code.";
         } else {
             warning = "Ambiguous article number or formatting. Reconstructed heavily. Verify exact article number and code.";
         }
     }

     return { original: clean, normalized, confidence, warning, matchedType: 'Code Article' };
  }

  // 3. Fallback / Unknown
  return {
     original: clean,
     normalized: clean,
     confidence: 0.2,
     warning: "Could not normalize. Unrecognized Swiss citation structure.",
     matchedType: 'Unknown'
  };
}
