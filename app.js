const API_BASE="https://trend.treafuns.workers.dev";
const CATS={all:"전체 트렌드",viral:"핫이슈·바이럴",food:"먹거리·핫플",shopping:"인기 상품·오픈런",fashion:"패션·뷰티",digital:"SNS·디지털 문화",slang:"신조어·밈",lifestyle:"라이프스타일"};
const AGE={viral:["10s","20s","30s"],food:["20s","30s","40s"],shopping:["20s","30s","40s"],fashion:["10s","20s","30s"],digital:["10s","20s"],slang:["10s","20s"],lifestyle:["30s","40s","50s"]};
const AGE_LABEL={"10s":"10대","20s":"20대","30s":"30대","40s":"40대","50s":"50대+"};
const STOP=new Set("오늘 이번 최근 관련 공개 대한 통해 위한 인기 트렌드 화제 이슈 온라인 사회 문화 소비 국내 한국 글로벌 올해 내년 시장 업계 업계서 주목 관심 발표 출시 진행 시작 확대 증가 감소 공개됐다 밝혔다 한다 하는 있는 있다 위해 경우 뉴스 기사 영상 사진 제공 소개 주말 주간 매일 단독 종합 속보".split(" "));
let items=[],cat="all",age="all",shown=12,periodDays=90;
const $=id=>document.getElementById(id);
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function safeUrl(s){try{let u=new URL(s);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return""}}
function stamp(x){let d=new Date(x||"");return isNaN(d)?0:d.getTime()}
function date(s){let d=new Date(s);return isNaN(d)?"최근":d.toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
function keywords(text){let t=String(text||"").toLowerCase();let matches=t.match(/[가-힣]{2,}|[a-z][a-z0-9+#.-]{2,}/g)||[];return [...new Set(matches.map(x=>x.replace(/[.,!?…·:;()[\]{}]/g,"")).filter(x=>x.length>=2&&!STOP.has(x)))].slice(0,18)}
function buildSignals(){const now=Date.now(),map=new Map();for(const n of items){const ts=stamp(n.publishedAt||n.createdAt)||now;for(const word of keywords(n.title)){if(!map.has(word))map.set(word,{word,count:0,recent:0,older:0,latest:0,cats:{},examples:[]});const s=map.get(word);s.count++;s.latest=Math.max(s.latest,ts);if(now-ts<86400000)s.recent++;else if(now-ts<3*86400000)s.older++;s.cats[n.category]=(s.cats[n.category]||0)+1;if(s.examples.length<2)s.examples.push(n.title)}}return [...map.values()].filter(x=>x.count>=1)}
function bestCategory(s){return Object.entries(s.cats).sort((a,b)=>b[1]-a[1])[0]?.[0]||"viral"}
function lifecycle(signals){let groups={new:[],rising:[],hot:[],cooling:[]};for(const s of signals){if(s.recent>=1&&s.older===0)groups.new.push(s);if(s.recent>=2&&s.recent>s.older)groups.rising.push(s);if(s.count>=3)groups.hot.push(s);if(s.older>=2&&s.older>s.recent*1.5)groups.cooling.push(s)}for(const k of Object.keys(groups))groups[k].sort((a,b)=>k==="cooling"?b.older-a.older:(b.recent*2+b.count)-(a.recent*2+a.count));return groups}
function activeItems(){const cutoff=Date.now()-periodDays*86400000;return items.filter(n=>stamp(n.publishedAt||n.createdAt)>=cutoff)}
function renderInsights(){const source=activeItems();const original=items;items=source;const signals=buildSignals();$("signals").textContent=signals.length;$("total").textContent=items.length;$("categoryTotal").textContent=Object.keys(CATS).length-1;
const rank=[...signals].sort((a,b)=>(b.recent*2.5+b.count+b.latest/1e13)-(a.recent*2.5+a.count+a.latest/1e13)).slice(0,10);
$("ranking").innerHTML=rank.length?rank.map((s,i)=>`<article class="rank-card"><span class="rank-no">${String(i+1).padStart(2,"0")}</span><div class="rank-main"><b>${esc(s.word)}</b><small>${esc(CATS[bestCategory(s)]||"트렌드")} · 기사 ${s.count}건 포착</small></div><span class="rank-score">${s.recent?"↗ "+s.recent:"• "+s.count}</span></article>`).join(""):'<div class="empty">분석할 키워드가 아직 충분하지 않습니다.</div>';
const life=lifecycle(signals);const fill=(id,list)=>$(id).innerHTML=list.length?list.slice(0,4).map(s=>`<span>${esc(s.word)}</span>`).join(""):'<span class="muted">데이터 부족</span>';fill("lifeNew",life.new);fill("lifeRising",life.rising);fill("lifeHot",life.hot);fill("lifeCooling",life.cooling);
const ages=["10s","20s","30s","40s","50s"],ageCats={"10s":["viral","fashion","digital","slang"],"20s":["viral","food","shopping","fashion","digital","slang"],"30s":["viral","food","shopping","fashion","lifestyle"],"40s":["food","shopping","lifestyle"],"50s":["lifestyle"]};
$("generation").innerHTML=ages.map(a=>{let counts={};for(const c of ageCats[a])counts[c]=items.filter(n=>n.category===c).length;let top=Object.entries(counts).sort((x,y)=>y[1]-x[1]).slice(0,3).filter(x=>x[1]>0);let total=top.reduce((z,x)=>z+x[1],0);return `<article class="gen-card"><div class="gen-top"><b>${AGE_LABEL[a]}</b><span>TOP INTEREST</span></div>${top.length?top.map(([c,v])=>`<div class="gen-row"><div><span>${esc(CATS[c])}</span><b>${Math.round(v/total*100)}%</b></div><i><em style="width:${Math.round(v/total*100)}%"></em></i></div>`).join(""):'<p class="muted">관련 콘텐츠 수집 대기 중</p>'}</article>`}).join("");items=original;}
function render(){let filtered=activeItems().filter(x=>(cat==="all"||x.category===cat)&&(age==="all"||(AGE[x.category]||[]).includes(age)));$("feedTitle").textContent=cat==="all"?"지금 뜨는 전체 트렌드":CATS[cat];$("count").textContent=filtered.length+" SIGNALS";if(!filtered.length){$("feed").innerHTML='<div class="empty">선택한 조건에 해당하는 트렌드가 없습니다.</div>';$("more").hidden=true;return}$("feed").innerHTML=filtered.slice(0,shown).map(n=>{let url=safeUrl(n.url),aud=(AGE[n.category]||[]).map(a=>AGE_LABEL[a]).join(" · ")||"전 연령";return `<article class="item"><div class="item-meta"><span class="pill">${esc(CATS[n.category]||"트렌드")}</span><span class="hot">${n.importance==="높음"?"HOT":"TREND"}</span><span>· ${date(n.publishedAt||n.createdAt)}</span></div><h3>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(n.title)}</a>`:esc(n.title)}</h3><p>${esc(n.summary||"관련 보도와 공개된 정보를 바탕으로 포착된 트렌드입니다.")}</p><div class="item-foot"><span class="audiences">관심층 예상 · ${aud}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">원문 보기 ↗</a>`:""}</div></article>`}).join("");$("more").hidden=filtered.length<=shown;}
async function load(){ $("feed").innerHTML='<div class="loading">최신 트렌드를 수집하고 있습니다…</div>';try{let r=await fetch(API_BASE+"/api/news?limit=5000");if(!r.ok)throw Error(r.status);let d=await r.json();items=d.items||[];renderInsights();render();$("updated").textContent="업데이트 "+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});$("intro").textContent=items.length?"최근 공개된 기사와 온라인 화제 키워드를 카테고리별로 모았습니다.":"아직 수집된 트렌드가 없습니다. Worker 수집 설정을 확인해 주세요.";}catch(e){$("feed").innerHTML='<div class="empty">데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';$("updated").textContent="연결 확인 필요";$("ranking").innerHTML='<div class="empty">데이터 연결 후 순위가 표시됩니다.</div>';}}
document.querySelectorAll(".period").forEach(b=>b.addEventListener("click",()=>{document.querySelector(".period.active")?.classList.remove("active");b.classList.add("active");periodDays=Number(b.dataset.days)||90;shown=12;renderInsights();render()}));
document.querySelectorAll(".cat").forEach(b=>b.addEventListener("click",()=>{document.querySelector(".cat.active")?.classList.remove("active");b.classList.add("active");cat=b.dataset.cat;shown=12;render()}));
document.querySelectorAll(".age").forEach(b=>b.addEventListener("click",()=>{document.querySelector(".age.active")?.classList.remove("active");b.classList.add("active");age=b.dataset.age;shown=12;render()}));
$("more").addEventListener("click",()=>{shown+=12;render()});$("refresh").addEventListener("click",load);$("theme").addEventListener("click",()=>document.body.classList.toggle("light"));load();


// Admin data collection controls: secrets are entered at runtime, never stored in site files.
async function runAdminRefresh(days, button, label) {
  const token = window.prompt("관리자 인증 토큰(ADMIN_TOKEN)을 입력하세요.\n토큰은 저장되지 않습니다.");
  if (token === null) return;
  if (!token.trim()) { alert("관리자 토큰을 입력해야 합니다."); return; }
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = "⏳ 수집 중…";
  try {
    const response = await fetch(API_BASE + "/api/refresh?days=" + days, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token.trim(), "Content-Type": "application/json" }
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error("인증 실패: ADMIN_TOKEN을 확인하세요.");
    if (!response.ok) throw new Error(result.error || ("요청 실패 (" + response.status + ")"));
    const failed = (result.diagnostics || []).filter(x => !x.ok).map(x => x.feed).join(", ");
    alert(label + " 완료\n신규 저장: " + (result.articles ?? 0) + "건\n중복 제외: " + (result.duplicates ?? 0) + "건\n수집 성공 카테고리: " + (result.successfulFeeds ?? 0) + "/" + (result.feeds ?? 7) + (failed ? "\n수집 확인 필요: " + failed : ""));
    await load();
  } catch (error) {
    alert("데이터 수집 실패\n" + (error.message || error));
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}
$("adminInitial").addEventListener("click", () => runAdminRefresh(365, $("adminInitial"), "최근 1년 최초 수집"));
$("adminRefresh").addEventListener("click", () => runAdminRefresh(7, $("adminRefresh"), "최근 7일 갱신"));
