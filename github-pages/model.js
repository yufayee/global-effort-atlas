// Shared, deterministic data helpers. No network access or private data.
export const relationTypes={theme:'研究主题关联',coauthor:'共同作者',institution:'同机构', 'team-member':'实验室成员',theory:'理论提出',concept:'概念关联',supports:'发现支持',revises:'发现修正',conflicts:'发现冲突'};
export function apaReference(p){
 const initial=s=>(s??'').trim().split(/\s+/).filter(Boolean).map(w=>w.split('-').map(x=>x[0]?.toUpperCase()+'.').join('-')).join(' ');
 const authors=(p.authors??[]).map(a=>a.given?`${a.family}, ${initial(a.given)}`:a.family);
 const names=authors.length>20?[...authors.slice(0,19),'…',authors.at(-1)].join(', '):authors.length>1?authors.slice(0,-1).join(', ')+', & '+authors.at(-1):authors[0];
 const b=p.bibliography??{};const details=(b.volume?`, ${b.volume}`:'')+(b.issue?`(${b.issue})`:'')+(b.pages?`, ${b.pages.replace(/-/g,'–')}`:b.articleNumber?`, Article ${b.articleNumber}`:'');
 return {text:`${names??'[作者待核]'} (${p.year??'n.d.'}). ${p.title.replace(/\.$/,'')}. ${p.journal??'[期刊待核]'}${details}.${p.doi?' https://doi.org/'+p.doi:''}`,status:p.doi&&authors.length&&!p.authorsPartial&&b.volume&&(b.pages||b.articleNumber)?'metadata-complete':'incomplete'};
}
export function validateCatalog(d){
 const errors=[],warnings=[],groups=['papers','researchers','teams','organizations','themes','concepts','relations','projects','updates'];const all=new Set();
 for(const g of groups){if(!Array.isArray(d[g])){errors.push('Missing collection '+g);continue;}for(const x of d[g]){if(!x.id||all.has(x.id)||!/^[a-z0-9][a-z0-9_-]*$/.test(x.id))errors.push('Missing/duplicate/invalid ID: '+g+':'+x.id);all.add(x.id);}}
 const ids=g=>new Set((d[g]??[]).map(x=>x.id));const check=(values,g,owner)=>{for(const id of values??[])if(!ids(g).has(id))errors.push(owner+' → missing '+g+':'+id);};const dois=new Set();
 for(const p of d.papers){if(!p.title)errors.push(p.id+': missing title');if(p.doi){const doi=p.doi.toLowerCase().trim();if(dois.has(doi))errors.push('Duplicate DOI '+doi);dois.add(doi);if(!/^10\.\d{4,9}\/\S+$/.test(doi))errors.push('Invalid DOI '+doi);}else warnings.push(p.id+': DOI pending');check(p.themes,'themes',p.id);check(p.researcherIds,'researchers',p.id);check(p.conceptIds,'concepts',p.id);check(p.relatedPaperIds,'papers',p.id);if(p.findingSummary&&p.review?.abstract?.status!=='checked'&&p.review?.fullText?.status!=='reviewed')errors.push(p.id+': unsourced findings');if(!p.method)warnings.push(p.id+': methods not reviewed');if(apaReference(p).status==='incomplete')warnings.push(p.id+': APA metadata incomplete');}
 for(const r of d.researchers){check([r.organizationId],'organizations',r.id);check(r.themes,'themes',r.id);if(r.photo?.status==='licensed'&&(!r.photo.src||!r.photo.license||!r.photo.sourcePage))errors.push(r.id+': missing photo rights');}
 for(const t of d.teams)check(t.memberIds,'researchers',t.id);
 for(const c of d.concepts){check(c.paperIds,'papers',c.id);check(c.themeIds,'themes',c.id);if(!c.sourceURLs?.length)errors.push(c.id+': missing conceptual sources');}
 for(const r of d.relations){if(!all.has(r.from)||!all.has(r.to))errors.push(r.id+': invalid endpoints');if(!(r.kind in relationTypes))errors.push(r.id+': unknown relation');if(r.kind!=='theme'&&!r.sourceURLs?.length)errors.push(r.id+': missing relation evidence');}
 const walk=(v,key='')=>{if(typeof v==='string'&&(/^https?:\/\//.test(v)||['website','primaryURL','publisherURL','sourceURL','sourcePage','sourceURLs','sources'].includes(key))){try{const u=new URL(v);if(!['https:','http:'].includes(u.protocol)||/(^|\.)notion\.(com|so)$/.test(u.hostname))errors.push('Private/invalid URL '+key);}catch{errors.push('Invalid URL '+key);}}else if(Array.isArray(v))v.forEach(x=>walk(x,key));else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(['personalNotes','originalNotionUrl'].includes(k))errors.push('Private field '+k);walk(x,k);}};walk(d);
 return {errors,warnings};
}
