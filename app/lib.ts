import{cookies}from"next/headers";
export const ACCESS_CODE="6387",ACCESS_TOKEN="s2-farms-6387-authorized-v2",SUPABASE_URL="https://mzdlimwxmsnpsetcjrcd.supabase.co",SUPABASE_KEY="sb_publishable_STY--5QKeIyT803DN4GOsw_pINOSHZH";
export async function memberToken(){return(await cookies()).get("nextasx_member")?.value||""}
export function guestCookieName(shareToken:string){return `nextasx_guest_${shareToken.replace(/[^a-zA-Z0-9]/g,"").slice(0,16)}`}
export async function guestSessionToken(shareToken:string){return(await cookies()).get(guestCookieName(shareToken))?.value||""}
export async function adminCode(){return(await cookies()).get("s2_access")?.value===ACCESS_TOKEN?ACCESS_CODE:""}
export async function memberIdentity(){const token=await memberToken();if(!token)return null;try{return await rpc("nextasx_session_identity",{p_token:token})}catch{return null}}
export async function allowed(){return(await cookies()).get("s2_access")?.value===ACCESS_TOKEN||Boolean(await memberIdentity())}
export function denied(){return Response.json({error:"Access code required"},{status:401})}
export async function rpc(name:string,body:Record<string,unknown>){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${SUPABASE_KEY}`,"content-type":"application/json"},body:JSON.stringify(body),cache:"no-store"});if(!r.ok)throw new Error(await r.text());return r.json()}
