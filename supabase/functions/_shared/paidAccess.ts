export async function requirePaidAccess(client: any, userId: string): Promise<void> {
  const { data, error } = await client.rpc('has_platform_access', { p_user_id: userId });
  if (error) throw Object.assign(new Error('Unable to verify subscription access'), { status: 503 });
  if (data !== true) throw Object.assign(new Error('An active paid subscription is required'), { status: 403 });
}

export async function reserveEmailQuota(client: any, userId: string, count: number): Promise<void> {
  const { data, error } = await client.rpc('reserve_email_quota', { p_user_id: userId, p_count: count });
  if (error) throw Object.assign(new Error('Unable to reserve email allowance'), { status: 503 });
  if (data !== true) throw Object.assign(new Error('Email allowance exhausted or subscription access removed'), { status: 403 });
}
