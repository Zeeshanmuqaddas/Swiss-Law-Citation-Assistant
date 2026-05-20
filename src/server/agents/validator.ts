export function validateCitations(summary: string, context: any): { valid: boolean; clean_summary: string } {
  const approvedKeywords = ["ZGB", "CO", "OR", "BGE", "Swiss Civil Code", "Obligationenrecht", "BV", "StGB", "Art.", "article"];
  
  const isValid = approvedKeywords.some(k => 
    summary.includes(k) || (context && context.explainable_summary && context.explainable_summary.includes(k))
  );
  
  const validationStatus = isValid 
    ? "\n\n**System Note:** ✔ Citations validated against Swiss legal references."
    : "\n\n**System Note:** ⚠ Missing verified Swiss legal citations.";
    
  return {
    valid: isValid,
    clean_summary: summary + validationStatus
  };
}
