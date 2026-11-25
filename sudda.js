/* 해봤수다 공통 — Supabase 연결 + 인증 + 헬퍼
   (publishable 키는 공개돼도 안전 — 보안은 Supabase RLS가 막음) */
const SB_URL = 'https://rfuyttyjvdfnaaqwoihg.supabase.co';
const SB_KEY = 'sb_publishable_AQC2VYzXfpCS8rZ_dNWMHw_rwLTYE68';
const sb = supabase.createClient(SB_URL, SB_KEY);

const HBSD_CATS = ['AI 부업','N잡 고민','시간관리','돈공부'];

async function hbsdUser(){ const { data } = await sb.auth.getUser(); return data.user || null; }
async function hbsdProfile(u){
  u = u || await hbsdUser(); if(!u) return null;
  const { data } = await sb.from('hbsd_profiles').select('*').eq('id', u.id).maybeSingle();
  return data;
}
async function hbsdIsAdmin(u){
  u = u || await hbsdUser(); if(!u) return false;
  const { data } = await sb.from('hbsd_admins').select('user_id').eq('user_id', u.id).maybeSingle();
  return !!data;
}
async function hbsdLoginKakao(){
  await sb.auth.signInWithOAuth({ provider:'kakao', options:{ redirectTo: window.location.href } });
}
async function hbsdLogout(){ await sb.auth.signOut(); location.reload(); }

async function hbsdProfilesByIds(ids){
  ids = [...new Set((ids||[]).filter(Boolean))];
  if(!ids.length) return {};
  const { data } = await sb.from('hbsd_profiles').select('id,nickname,avatar_url,is_senior').in('id', ids);
  const m = {}; (data||[]).forEach(p => m[p.id] = p); return m;
}
function hbsdEsc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function hbsdDate(s){ if(!s) return ''; const d=new Date(s); const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())}`; }
function hbsdWhen(s){ if(!s) return ''; const d=new Date(s); const p=n=>String(n).padStart(2,'0');
  const days=['일','월','화','수','목','금','토'];
  return `${d.getMonth()+1}월 ${d.getDate()}일(${days[d.getDay()]}) ${p(d.getHours())}:${p(d.getMinutes())}`; }
