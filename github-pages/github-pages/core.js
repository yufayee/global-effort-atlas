export const normalize=s=>String(s??'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function searchMatch(item,q){return !q||normalize(JSON.stringify(item)).includes(normalize(q).trim());}
export function filterPapers(papers,{q='',theme='',topic='',year='',type='',researcher='',evidence='',method='',population='',outcome=''}={}){return papers.filter(p=>searchMatch(p,q)&&(!topic||(p.topics??[]).includes(topic))&&(!theme||p.themes.includes(theme))&&(!year||String(p.year)===year)&&(!type||p.publicationType===type)&&(!researcher||p.researcherIds.includes(researcher))&&(!evidence||p.evidenceType===evidence)&&(!method||(p.method??'unknown')===method)&&(!population||(p.population??'unknown')===population)&&(!outcome||(p.outcomes??'unknown')===outcome));}
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeURL=s=>/^https?:\/\//i.test(s??'')?s:'#';
export function isNotionURL(s){try{return /(^|\.)notion\.(com|so)$/i.test(new URL(s).hostname);}catch{return false;}}
export function canonicalDOI(value){return String(value??'').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').match(/^10\.\d{4,9}\/[^\s<>]+/i)?.[0]??null;}
export function academicURL(value){return safeURL(value)!=='#'&&!isNotionURL(value)?value:null;}
export function csv(rows){return '\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');}
