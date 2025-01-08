import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const readDomainId = async (domain?: string): Promise<{ id: number; domain_id: string } | null> => {
  if (!domain) {
    console.error("Domain is undefined or empty");
    return null;
  }
  console.log("Querying domain_id with:", domain.toLowerCase()); // Logging the query parameter
  const { data, error } = await supabase
    .from('schools')
    .select('id, domain_id')
    .eq('domain_id', domain.toLowerCase())
    .maybeSingle(); // Changed from .single() to .maybeSingle()

  if (error) {
    console.error("Error fetching domain data:", error);
    return null;
  }

  console.log("Domain data found:", data); // Logging fetched data
  return data;
};