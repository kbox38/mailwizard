import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadDailyEngagement(client: SupabaseClient, userId: string, start: string, end: string) {
  const counts = new Map<string, { opens: number; clicks: number }>();
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    // Scope by the campaign owner in SQL instead of constructing an unbounded
    // campaign ID URL. RLS still applies to both tables.
    const { data, error } = await client.from('email_events')
      .select('id,event_type,timestamp,campaigns!inner(user_id)')
      .eq('campaigns.user_id', userId)
      .in('event_type', ['open', 'click'])
      .gte('timestamp', start).lte('timestamp', end)
      .order('timestamp', { ascending: true }).order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const event of data || []) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const count = counts.get(date) || { opens: 0, clicks: 0 };
      if (event.event_type === 'open') count.opens++;
      if (event.event_type === 'click') count.clicks++;
      counts.set(date, count);
    }
    if (!data || data.length < pageSize) return counts;
  }
}
