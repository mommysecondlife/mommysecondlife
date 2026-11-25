/* umsera-auth.js — 모든 페이지 공용 로그인/계정 위젯 + 프로필 수정
   필요: supabase UMD + sudda.js 를 먼저 로드할 것
   사용: nav 안에 <div data-account></div> 를 두면 거기에 로그인/계정이 렌더됨 */
(function(){
  if(window.__UAUTH_LOADED) return; window.__UAUTH_LOADED = true;

  const esc = window.hbsdEsc || (s => (s||''));
  const AV_PRESETS = [['🐥','#FFE8A3'],['🌸','#FDE1EA'],['🍀','#D7F0DF'],['🐰','#EADFFB'],['☕','#EADFD3'],['🌙','#DCE6FB']];
  function avImg(url,size){
    return url
      ? `<img src="${esc(url)}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;background:#FDE8EE">`
      : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#FDE8EE;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.42)}px">🙂</div>`;
  }
  function presetAv(e,b){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' rx='60' fill='${b}'/><text x='60' y='82' font-size='62' text-anchor='middle'>${e}</text></svg>`;
    return 'data:image/svg+xml,'+encodeURIComponent(svg);
  }

  const CSS = `
  .uacct{position:relative;display:inline-block}
  .uacct-btn{display:flex;align-items:center;background:#fff;border:1px solid #FAD9E1;border-radius:999px;padding:3px;cursor:pointer}
  .uacct-btn img{width:28px;height:28px;border-radius:50%;object-fit:cover;background:#FDE8EE}
  .uacct-menu{position:absolute;right:0;top:46px;width:226px;background:#fff;border:1px solid #FAD9E1;border-radius:16px;box-shadow:0 14px 40px rgba(58,31,43,.18);overflow:hidden;z-index:120;display:none}
  .uacct-menu.on{display:block}
  .uacct-head{padding:15px 16px 13px;display:flex;align-items:center;gap:11px;border-bottom:1px solid #FAD9E1}
  .uacct-head img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#FDE8EE}
  .uacct-head .nm{font-weight:800;font-size:15px;line-height:1.3;color:#3A1F2B}
  .uacct-head .sub{font-size:12px;color:#8A6B74}
  .uacct-menu a,.uacct-menu button{display:flex;width:100%;align-items:center;gap:10px;padding:13px 16px;background:none;border:0;font-family:inherit;font-size:14.5px;font-weight:700;color:#3A1F2B;cursor:pointer;text-align:left;text-decoration:none}
  .uacct-menu a:hover,.uacct-menu button:hover{background:#FDE8EE}
  .uacct-menu .usep{height:1px;background:#FAD9E1}
  .uacct-menu .u-logout{color:#C81E4A}
  .uauth-login{border:0;cursor:pointer;font-family:inherit;font-weight:700;border-radius:12px;padding:9px 14px;font-size:14px;background:#FEE500;color:#3A1D1D;white-space:nowrap}
  .us-scrim{position:fixed;inset:0;background:rgba(58,31,43,.5);z-index:140;display:none}
  .us-scrim.on{display:block}
  .us-sheet{position:fixed;left:0;right:0;bottom:0;z-index:141;background:#fff;border-radius:22px 22px 0 0;max-width:560px;margin:0 auto;max-height:92vh;overflow-y:auto;padding:22px 18px 30px;transform:translateY(100%);transition:transform .28s;font-family:inherit;color:#3A1F2B}
  .us-sheet.on{transform:none}
  .us-sheet h3{margin:0 0 14px;font-size:20px}
  .us-sheet .x{position:absolute;right:14px;top:14px;width:40px;height:40px;border:0;background:#FDE8EE;border-radius:50%;font-size:20px;cursor:pointer;color:#3A1F2B}
  .us-sheet .fld{display:block;font-weight:700;font-size:14px;margin:14px 0 6px}
  .us-sheet .inp{width:100%;border:1.5px solid #FAD9E1;border-radius:12px;padding:12px 13px;font-family:inherit;font-size:15px;color:#3A1F2B}
  .us-sheet .inp:focus{outline:none;border-color:#E8335F}
  .us-btn{border:0;cursor:pointer;font-family:inherit;font-weight:700;border-radius:14px;padding:14px;font-size:16px;width:100%;background:#E8335F;color:#fff;margin-top:18px}
  .us-ghost{border:1px solid #FAD9E1;background:#fff;color:#8A6B74;border-radius:12px;padding:9px 14px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
  .us-presets{display:flex;flex-wrap:wrap;gap:8px}
  .us-opt{width:52px;height:52px;border-radius:50%;border:2px solid #FAD9E1;cursor:pointer;font-size:26px;line-height:1}
  .us-hint{font-size:13px;color:#8A6B74;margin-top:10px}
  .us-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(20px);z-index:160;background:#3A1F2B;color:#fff;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:700;opacity:0;pointer-events:none;transition:all .25s}
  .us-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
  `;
  const SHEET = `<div class="us-scrim" id="usScrim"></div>
  <div class="us-sheet" id="usSheet"><button class="x" id="usX" aria-label="닫기">×</button><h3>내 정보</h3><div id="usEdit"></div></div>
  <div class="us-toast" id="usToast"></div>`;

  const U = { user:null, profile:null, isAdmin:false, isSenior:false };
  let readyResolve; U.ready = new Promise(r => readyResolve = r);
  let PENDING_AV = null;
  const $ = s => document.querySelector(s);
  function toast(m){ const t=$('#usToast'); if(!t) return; t.textContent=m; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),1800); }

  function inject(){
    if(!document.getElementById('uauth-style')){ const s=document.createElement('style'); s.id='uauth-style'; s.textContent=CSS; document.head.appendChild(s); }
    if(!document.getElementById('usSheet')){ const d=document.createElement('div'); d.innerHTML=SHEET; while(d.firstChild) document.body.appendChild(d.firstChild);
      $('#usX').onclick=closeProfile; $('#usScrim').onclick=closeProfile; }
  }
  function openProfile(){
    PENDING_AV = U.profile?.avatar_url || null;
    const nm = esc(U.profile?.nickname || '');
    $('#usEdit').innerHTML = `<div style="text-align:center">
        <div id="usAvPrev">${avImg(PENDING_AV,88)}</div>
        <div style="margin:12px 0 2px;display:flex;gap:8px;justify-content:center">
          <button class="us-ghost" id="usUp">📷 내 사진</button><button class="us-ghost" id="usClr">기본으로</button></div>
        <input type="file" id="usFile" accept="image/*" style="display:none"></div>
      <label class="fld">캐릭터로 고르기</label>
      <div class="us-presets" id="usPre"></div>
      <label class="fld">닉네임 <span style="color:#8A6B74;font-weight:400">· 자유롭게 바꿀 수 있어요</span></label>
      <input class="inp" id="usNick" maxlength="20" value="${nm}" placeholder="질문·답변에 보일 이름">
      <p class="us-hint">실명·실제 사진 대신 편한 닉네임·캐릭터로 활동하세요. 로그인은 카카오로 안전하게 유지돼요 🔒</p>
      <button class="us-btn" id="usSave">저장</button>`;
    $('#usPre').innerHTML = AV_PRESETS.map(p=>`<button type="button" class="us-opt" data-av="${esc(presetAv(p[0],p[1]))}" style="background:${p[1]}">${p[0]}</button>`).join('');
    $('#usPre').querySelectorAll('.us-opt').forEach(b=>b.onclick=()=>{ PENDING_AV=b.dataset.av; $('#usAvPrev').innerHTML=avImg(PENDING_AV,88); });
    $('#usUp').onclick=()=>$('#usFile').click();
    $('#usClr').onclick=()=>{ PENDING_AV=null; $('#usAvPrev').innerHTML=avImg(null,88); };
    $('#usFile').onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
      if(f.size>3*1024*1024){ toast('3MB 이하 사진으로 올려주세요'); return; }
      toast('사진 올리는 중…'); const u=await uploadAvatar(f);
      if(u){ PENDING_AV=u; $('#usAvPrev').innerHTML=avImg(u,88); toast('사진 올렸어요'); } };
    $('#usSave').onclick=saveProfile;
    $('#usScrim').classList.add('on'); $('#usSheet').classList.add('on'); document.body.style.overflow='hidden';
  }
  function closeProfile(){ $('#usScrim').classList.remove('on'); $('#usSheet').classList.remove('on'); document.body.style.overflow=''; }
  async function uploadAvatar(file){
    const ext=((file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''))||'jpg';
    const path=`${U.user.id}/av_${Date.now()}.${ext}`;
    const { error }=await sb.storage.from('avatars').upload(path,file,{upsert:true,cacheControl:'3600'});
    if(error){ toast('업로드 오류: '+error.message); return null; }
    return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }
  async function saveProfile(){
    const nick=$('#usNick').value.trim(); if(!nick){ toast('닉네임을 적어주세요'); return; }
    const { error }=await sb.from('hbsd_profiles').update({nickname:nick, avatar_url:PENDING_AV}).eq('id',U.user.id);
    if(error){ toast('오류: '+error.message); return; }
    U.profile.nickname=nick; U.profile.avatar_url=PENDING_AV; renderAll(); closeProfile(); toast('저장했어요 ✨');
  }

  function renderInto(el){
    if(!U.user){ el.innerHTML=`<button class="uauth-login">카카오 로그인</button>`; el.querySelector('.uauth-login').onclick=hbsdLoginKakao; return; }
    const nm=esc(U.profile?.nickname||'엄마');
    el.innerHTML=`<div class="uacct">
      <button class="uacct-btn" aria-label="내 계정">${avImg(U.profile?.avatar_url,28)}</button>
      <div class="uacct-menu">
        <div class="uacct-head">${avImg(U.profile?.avatar_url,42)}<div><div class="nm">${nm}${U.isAdmin?' 👑':''}</div><div class="sub">${U.isAdmin?'관리자':'해봤수다 회원'}</div></div></div>
        <button class="u-profile">🙂&nbsp; 프로필 수정</button>
        <a href="my.html">📋&nbsp; 신청내역</a>
        ${U.isAdmin?'<a href="admin.html">👑&nbsp; 관리자</a>':''}
        <div class="usep"></div>
        <button class="u-logout">↩&nbsp; 로그아웃</button>
      </div></div>`;
    const menu=el.querySelector('.uacct-menu');
    el.querySelector('.uacct-btn').onclick=e=>{ e.stopPropagation();
      document.querySelectorAll('.uacct-menu.on').forEach(m=>{ if(m!==menu) m.classList.remove('on'); });
      menu.classList.toggle('on'); };
    el.querySelector('.u-profile').onclick=()=>{ menu.classList.remove('on'); openProfile(); };
    el.querySelector('.u-logout').onclick=hbsdLogout;
  }
  function renderAll(){ document.querySelectorAll('[data-account]').forEach(renderInto); }

  async function init(){
    inject();
    try{ U.user=await hbsdUser(); }catch(e){}
    if(U.user){ U.profile=await hbsdProfile(U.user); U.isAdmin=await hbsdIsAdmin(U.user); U.isSenior=!!(U.profile&&U.profile.is_senior); }
    renderAll();
    readyResolve({ user:U.user, profile:U.profile, isAdmin:U.isAdmin, isSenior:U.isSenior });
  }
  document.addEventListener('click',e=>{ if(!e.target.closest('.uacct')) document.querySelectorAll('.uacct-menu.on').forEach(m=>m.classList.remove('on')); });
  window.UAUTH=U; window.UAUTH.openProfile=openProfile;
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
