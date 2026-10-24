interface RecipientToken { purpose: 'resubscribe'; contactId: string; campaignId: string; expiresAt: number }
const encoder = new TextEncoder();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function key(secret: string) {
  if (!secret) throw new Error('Recipient signing secret unavailable');
  return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function createRecipientToken(contactId: string,campaignId: string,secret: string): Promise<string> {
  const payload = btoa(JSON.stringify({purpose:'resubscribe',contactId,campaignId,expiresAt:Date.now()+15*60*1000}));
  const signature = await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature),byte=>byte.toString(16).padStart(2,'0')).join('')}`;
}
export async function verifyRecipientToken(token: unknown,secret: string): Promise<RecipientToken | null> {
  try {
    if(typeof token!=='string'||token.length>4096)return null;
    const [payload,signature,extra]=token.split('.');
    if(extra||!payload||!/^[0-9a-f]{64}$/.test(signature))return null;
    const raw=Uint8Array.from(signature.match(/../g)!,byte=>parseInt(byte,16));
    if(!await crypto.subtle.verify('HMAC',await key(secret),raw,encoder.encode(payload)))return null;
    const data=JSON.parse(atob(payload));
    if(data.purpose!=='resubscribe'||!uuid.test(data.contactId)||!uuid.test(data.campaignId)
      ||!Number.isFinite(data.expiresAt)||data.expiresAt<Date.now()||data.expiresAt>Date.now()+15*60*1000)return null;
    return data;
  } catch {return null;}
}
