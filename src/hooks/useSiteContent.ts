import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSiteContent<T = Record<string, any>>(sectionKey: string) {
  return useQuery({
    queryKey: ["site-content", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", sectionKey)
        .single();
      if (error) return null;
      return data?.content as T | null;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useUpdateSiteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionKey, content }: { sectionKey: string; content: Record<string, any> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("site_content")
        .update({ content, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("section_key", sectionKey);
      if (error) throw error;
    },
    onSuccess: (_, { sectionKey }) => {
      queryClient.invalidateQueries({ queryKey: ["site-content", sectionKey] });
    },
  });
}
