import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { TermsAndPrivacyModal } from "@/components/terms/TermsAndPrivacyModal";
import { DeleteAccountConfirmationDialog } from "@/components/auth/DeleteAccountConfirmationDialog";
import { formatRelativeTime, formatDate } from "@/lib/utils/date";
import { getAuthToken } from "@/lib/auth/get-auth-token";
import { supabaseClient as supabase } from "@/db/supabase.client";

interface AccountProfileProps {
  userEmail: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
}

/**
 * Account profile component that displays user account information,
 * provides access to Terms and Privacy Policy, and includes account management features.
 */
export function AccountProfile({ userEmail, termsAccepted, termsAcceptedAt }: AccountProfileProps) {
  const { t } = useTranslation();
  const [isTermsModalOpen, setIsTermsModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setDeleteError(t("account.deleteAccountError"));
        setIsDeletingAccount(false);
        return;
      }

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, redirect to login
          window.location.href = "/auth/login";
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        setDeleteError(errorData.error || t("account.deleteAccountError"));
        setIsDeletingAccount(false);
        return;
      }

      // Account deleted successfully
      // Sign out and redirect to home page
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("account.deleteAccountError");
      setDeleteError(errorMessage);
      setIsDeletingAccount(false);
      if (import.meta.env.DEV) {
        console.error("Error deleting account:", error);
      }
    }
  };

  // Handle change password (placeholder - to be implemented)
  const handleChangePassword = () => {
    // TODO: Implement change password functionality
    alert("Change password functionality will be implemented soon.");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("account.title")}</h1>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.accountInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{t("account.email")}</div>
            <div className="text-base font-medium">{userEmail}</div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Privacy Policy Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.termsAndPrivacy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("account.acceptedAt")}</div>
              <div className="text-base">
                {termsAccepted && termsAcceptedAt ? (
                  formatRelativeTime(termsAcceptedAt, t)
                ) : (
                  <span className="text-muted-foreground">{t("account.notAccepted")}</span>
                )}
              </div>
              {termsAccepted && termsAcceptedAt && (
                <div className="text-xs text-muted-foreground">{formatDate(termsAcceptedAt)}</div>
              )}
            </div>
            <Button variant="outline" onClick={() => setIsTermsModalOpen(true)}>
              {t("account.viewCurrentTerms")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.accountManagement")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">
              {t("account.changePassword")}
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="w-full sm:w-auto">
              {t("account.deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.legalInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("account.dataProcessorNotice")}</p>
            <p>{t("account.contactInformation")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Privacy Modal */}
      <TermsAndPrivacyModal
        open={isTermsModalOpen}
        onOpenChange={setIsTermsModalOpen}
        onAccept={() => setIsTermsModalOpen(false)}
        mode="view"
      />

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
        error={deleteError}
      />
    </div>
  );
}
