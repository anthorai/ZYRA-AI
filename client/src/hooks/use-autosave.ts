import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AutosaveOptions = {
  endpoint: string;
  data: any;
  enabled: boolean;
  debounceMs?: number;
};

export function useAutosave({ endpoint, data, enabled, debounceMs = 2000 }: AutosaveOptions) {
  const { toast } = useToast();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef(data);

  const saveMutation = useMutation({
    mutationFn: async (draftData: any) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      return response.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "Failed to save draft",
        description: "Your changes may not be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!enabled || !data) return;

    if (JSON.stringify(data) !== JSON.stringify(dataRef.current)) {
      dataRef.current = data;
      setIsSaving(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveMutation.mutate(data);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs]);

  return {
    isSaving,
    lastSaved,
    forceSave: () => saveMutation.mutate(data),
  };
}
