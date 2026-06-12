import { supabase } from "@/integrations/supabase/client";

export const teamService = {
  async listAll() {
    const { data, error } = await supabase.from("teams").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
};
