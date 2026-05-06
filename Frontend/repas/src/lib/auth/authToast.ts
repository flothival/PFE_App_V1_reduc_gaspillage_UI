import { toast } from "@/hooks/use-toast";

export function toastAuthError(description: string) {
  toast({
    variant: "destructive",
    title: "Erreur d'authentification",
    description,
  });
}
