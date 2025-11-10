/**
 * Type definitions for Terms and Privacy Policy content structure.
 */

export interface TermsSection {
  id: string;
  heading: string;
  content: string; // Markdown content
}

export interface TermsContent {
  terms: {
    title: string;
    sections: TermsSection[];
  };
  privacy: {
    title: string;
    sections: TermsSection[];
  };
}
