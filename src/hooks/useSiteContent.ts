import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Bulk fetch: single query for all site_content rows
export function useAllSiteContent() {
  return useQuery({
    queryKey: ["site-content-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content");
      if (error) return {};
      const map: Record<string, any> = {};
      data?.forEach((row) => { map[row.section_key] = row.content; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Single section hook — uses the bulk cache if available, otherwise fetches individually
export function useSiteContent<T = Record<string, any>>(sectionKey: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["site-content", sectionKey],
    queryFn: async () => {
      // Try to use bulk cache first
      const bulkData = queryClient.getQueryData<Record<string, any>>(["site-content-all"]);
      if (bulkData && sectionKey in bulkData) {
        return bulkData[sectionKey] as T | null;
      }
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", sectionKey)
        .single();
      if (error) return null;
      return data?.content as T | null;
    },
    staleTime: 5 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ["site-content-all"] });
    },
  });
}
