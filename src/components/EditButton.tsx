import { Button } from "./ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface EditButtonProps {
  planId: string;
}

export function EditButton({ planId }: EditButtonProps) {
  const { t } = useTranslation();

  return (
    <Button onClick={() => (window.location.href = `/app/edit/${planId}`)} data-testid="edit-button">
      {t("view.edit")}
    </Button>
  );
}
