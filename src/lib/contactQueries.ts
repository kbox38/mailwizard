import type { SupabaseClient } from '@supabase/supabase-js';

export const CONTACT_PAGE_SIZE = 50;

export function contactPageQuery(client: SupabaseClient, userId: string, groupId: string | null, search: string, page: number) {
  let query = client.from('contacts')
    .select(groupId ? '*, contact_group_members!inner(group_id)' : '*', { count: 'exact' })
    .eq('user_id', userId);

  if (groupId) query = query.eq('contact_group_members.group_id', groupId);
  if (search.trim()) {
    // Quote PostgREST values and escape LIKE wildcards so search remains literal.
    const term = search.trim().replace(/[\\%_]/g, '\\$&');
    const pattern = JSON.stringify(`%${term}%`);
    query = query.or(['email', 'first_name', 'last_name', 'company']
      .map(field => `${field}.ilike.${pattern}`).join(','));
  }

  return query.order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * CONTACT_PAGE_SIZE, (page + 1) * CONTACT_PAGE_SIZE - 1);
}
