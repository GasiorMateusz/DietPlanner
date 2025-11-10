import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { TERMS_CONFIG, ALL_REQUIRED_SECTIONS } from "@/lib/terms/terms.config";
import { loadTermsContent } from "@/lib/terms/terms-loader";
import type { TermsContent } from "@/lib/terms/terms.types";

interface TermsAndPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  mode?: "registration" | "view";
}

/**
 * Modal dialog component that displays Terms of Service and Privacy Policy.
 * Supports two modes:
 * - "registration": Shows checkboxes for required sections, "Accept All" button
 * - "view": Read-only mode without checkboxes
 */
export function TermsAndPrivacyModal({
  open,
  onOpenChange,
  onAccept,
  mode = "registration",
}: TermsAndPrivacyModalProps) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<"terms" | "privacy">("terms");
  const [termsContent, setTermsContent] = React.useState<TermsContent | null>(null);
  const [checkedSections, setCheckedSections] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load terms content when modal opens
  React.useEffect(() => {
    if (!open) {
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      setError(null);
      setCheckedSections(new Set());

      try {
        const content = await loadTermsContent(language);
        setTermsContent(content);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load terms";
        setError(errorMessage);
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Error loading terms content:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [open, language]);

  // Handle checkbox toggle
  const handleSectionToggle = (sectionId: string) => {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Handle select all for a specific tab
  const handleSelectAll = (sectionIds: readonly string[], checked: boolean) => {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      if (checked) {
        sectionIds.forEach((id) => next.add(id));
      } else {
        sectionIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  // Check if all sections in a tab are checked
  const areAllSectionsChecked = (sectionIds: readonly string[]) => {
    return sectionIds.every((sectionId) => checkedSections.has(sectionId));
  };

  // Check if all required sections are checked
  const allSectionsChecked = React.useMemo(() => {
    if (mode !== "registration") {
      return true;
    }
    return ALL_REQUIRED_SECTIONS.every((sectionId) => checkedSections.has(sectionId));
  }, [checkedSections, mode]);

  // Handle Accept All button
  const handleAccept = () => {
    if (allSectionsChecked) {
      onAccept();
      onOpenChange(false);
    }
  };

  // Render select all checkbox for a tab
  const renderSelectAll = (requiredSections: readonly string[], tabId: "terms" | "privacy") => {
    if (mode !== "registration") {
      return null;
    }

    const allChecked = areAllSectionsChecked(requiredSections);

    return (
      <div className="flex items-start gap-3 pb-4 mb-4 border-b">
        <Checkbox
          id={`select-all-${tabId}`}
          checked={allChecked}
          onCheckedChange={(checked) => handleSelectAll(requiredSections, checked === true)}
          aria-label={t("terms.selectAll")}
          className="mt-1"
        />
        <Label htmlFor={`select-all-${tabId}`} className="cursor-pointer font-semibold text-base leading-tight flex-1">
          {t("terms.selectAll")}
        </Label>
      </div>
    );
  };

  // Render sections with checkboxes for registration mode
  const renderSections = (
    sections: { id: string; heading: string; content: string }[],
    requiredSections: readonly string[]
  ) => {
    return sections.map((section) => {
      const isRequired = requiredSections.includes(section.id);
      const isChecked = checkedSections.has(section.id);

      if (mode === "registration" && isRequired) {
        // Registration mode: show checkbox for required sections
        return (
          <div key={section.id} className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-3">
              <Checkbox
                id={section.id}
                checked={isChecked}
                onCheckedChange={() => handleSectionToggle(section.id)}
                aria-label={`Accept ${section.heading}`}
                className="mt-1"
              />
              <Label htmlFor={section.id} className="cursor-pointer font-semibold text-base leading-tight flex-1">
                {section.heading}
              </Label>
            </div>
            {section.content && (
              <div className="ml-7 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            )}
          </div>
        );
      }

      // View mode or non-required section: render normally
      return (
        <div key={section.id} className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0">
          <h3 className="font-semibold text-base">{section.heading}</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{section.content}</ReactMarkdown>
          </div>
        </div>
      );
    });
  };

  const renderTermsContent = () => {
    if (!termsContent?.terms) {
      return (
        <div role="status" aria-live="polite">
          <p>{t("common.loading")}</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6 pr-4">
          {renderSelectAll(TERMS_CONFIG.requiredTermsSections, "terms")}
          {renderSections(termsContent.terms.sections, TERMS_CONFIG.requiredTermsSections)}
        </div>
      </ScrollArea>
    );
  };

  const renderPrivacyContent = () => {
    if (!termsContent?.privacy) {
      return (
        <div role="status" aria-live="polite">
          <p>{t("common.loading")}</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6 pr-4">
          {renderSelectAll(TERMS_CONFIG.requiredPrivacySections, "privacy")}
          {renderSections(termsContent.privacy.sections, TERMS_CONFIG.requiredPrivacySections)}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("terms.title")}</DialogTitle>
          <DialogDescription>
            {mode === "registration" ? t("terms.description") : t("terms.viewDescription")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-destructive bg-destructive/10 text-destructive">
            <AlertDescription>
              {t("terms.loadError")}
              {import.meta.env.DEV && `: ${error}`}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-[400px]" role="status" aria-live="polite" aria-busy="true">
            <p>{t("common.loading")}</p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "terms" | "privacy")}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms">{termsContent?.terms.title || t("terms.termsTitle")}</TabsTrigger>
              <TabsTrigger value="privacy">{termsContent?.privacy.title || t("terms.privacyTitle")}</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="flex-1 mt-4 min-h-0">
              {renderTermsContent()}
            </TabsContent>

            <TabsContent value="privacy" className="flex-1 mt-4 min-h-0">
              {renderPrivacyContent()}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          {mode === "registration" && (
            <Button onClick={handleAccept} disabled={!allSectionsChecked}>
              {t("terms.acceptAll")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
