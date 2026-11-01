/* G-star Weltkeimwerk 1.0.0 · LicenseRef-HALVETH-PIRL-2.0.
 * Finite local text-state model. Records never perform external actions.
 */
(function (root) {
  'use strict';
  const VERSION='1.0.0';
  const LIMITS=Object.freeze({maxEvents:128,maxStates:48,maxUnknowns:64,maxParents:8,maxRawTextBytes:8192,maxTextBytes:2048,maxExportBytes:4*1024*1024});
  const DEFINITIONS=Object.freeze({genesis:'GSTAR_TEXT_GENESIS_1',equality:'EXACT_UNICODE_TEXT_1',parentCount:'DISTINCT_ENTITY_PARENTS_1',relation:'GENEALOGICAL_STATE_DERIVATION_1',observation:'LOCAL_STATE_RECORD_READ_1',root:'EXPLICIT_LOCAL_ANCHOR_1',hash:'SHA256_SELF_CONSISTENCY_1'});
  const RELATION_CONTRACT={id:DEFINITIONS.relation,version:VERSION,inputDomain:'BOUND_LOCAL_TEXT_STATE',outputDomain:'BOUND_LOCAL_TEXT_STATE',meaning:'The right state was created by one explicit PROPOSE command using the left state as a declared parent.',direction:'PARENT_TO_DERIVED_STATE',algebra:{transitive:false,symmetric:false,irreflexive:true},source:'GSTAR_LOCAL_SOFTWARE_DEFINITION_1',claimCeiling:'LOCAL_GENEALOGY_NOT_EXTERNAL_CAUSALITY'};
  const CLOCK=Object.freeze({model:'MONOTONIC_EVENT_ORDINAL',recorded:'LOCAL_DEVICE_UTC',calibration:'UNKNOWN',eventTimeOutsideModel:'UNKNOWN'});
  const encoder=new TextEncoder();
  const subtle=root.crypto?.subtle||(typeof require==='function'?require('node:crypto').webcrypto.subtle:null);
  const copy=x=>JSON.parse(JSON.stringify(x));
  function assert(condition,code){if(!condition)throw new Error(code);}
  function plain(x){return x!==null&&typeof x==='object'&&Object.getPrototypeOf(x)===Object.prototype;}
  function unicode(s){for(const c of s){const n=c.codePointAt(0);assert(n<0xd800||n>0xdfff,'ILL_FORMED_UNICODE');}}
  function json(value,depth=0,seen=new Set()){
    assert(depth<=32,'JSON_DEPTH_LIMIT');
    if(value===null||typeof value==='boolean')return;
    if(typeof value==='string'){unicode(value);return;}
    if(typeof value==='number'){assert(Number.isFinite(value)&&!Object.is(value,-0),'INVALID_JSON_NUMBER');return;}
    assert(typeof value==='object'&&!seen.has(value),'INVALID_JSON_VALUE');seen.add(value);
    if(Array.isArray(value)){
      assert(Object.getPrototypeOf(value)===Array.prototype,'INVALID_ARRAY');
      const keys=Reflect.ownKeys(value);assert(keys.length===value.length+1&&keys.includes('length'),'NON_DENSE_ARRAY');
      for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));assert(d&&d.enumerable&&Object.hasOwn(d,'value'),'NON_DENSE_ARRAY');json(d.value,depth+1,seen);}
    }else{
      assert(plain(value),'INVALID_JSON_OBJECT');
      for(const k of Reflect.ownKeys(value)){assert(typeof k==='string','INVALID_JSON_KEY');unicode(k);const d=Object.getOwnPropertyDescriptor(value,k);assert(d.enumerable&&Object.hasOwn(d,'value'),'NON_DATA_PROPERTY');json(d.value,depth+1,seen);}
    }
    seen.delete(value);
  }
  function canonical(value){json(value);return serialize(value);}
  function serialize(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(serialize).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+serialize(value[k])).join(',')+'}';}
  async function hashText(text){assert(subtle,'SHA256_UNAVAILABLE');const bytes=await subtle.digest('SHA-256',encoder.encode(text));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
  async function digest(value){return hashText(canonical(value));}
  function exact(value,keys){assert(plain(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k)),'INVALID_FIELDS');}
  function text(value,max,empty=false){assert(typeof value==='string','INVALID_TEXT');unicode(value);assert((empty||value.trim().length>0)&&encoder.encode(value).length<=max,'TEXT_LIMIT_OR_EMPTY');return value;}
  function identifier(value){assert(typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(value),'INVALID_ID');return value;}
  function iso(value){assert(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value,'INVALID_RECORDED_AT');return value;}
  const commandKeys={SEED:['type','label','text'],PROPOSE:['type','parents','mode','text','trigger'],MATERIALIZE:['type','stateId'],OBSERVE:['type','stateId'],OPEN_UNKNOWN:['type','stateId','question','reopenTrigger'],REVISIT:['type','unknownId','evidence'],SNAPSHOT:['type'],REANCHOR:['type','snapshotId']};
  function validateCommand(command){
    json(command);assert(plain(command)&&Object.hasOwn(commandKeys,command.type),'INVALID_COMMAND');exact(command,commandKeys[command.type]);
    if(command.type==='SEED'){text(command.label,160);text(command.text,LIMITS.maxRawTextBytes);}
    if(command.type==='PROPOSE'){
      assert(['DERIVE_CHILD','REVISE','COMPOSE','CLONE_INSTANCE'].includes(command.mode),'INVALID_MODE');
      assert(Array.isArray(command.parents)&&command.parents.length>0&&command.parents.length<=LIMITS.maxParents,'INVALID_PARENT_COUNT');
      command.parents.forEach(identifier);assert(new Set(command.parents).size===command.parents.length,'DUPLICATE_PARENT');
      assert(command.mode==='COMPOSE'?command.parents.length>=2:command.parents.length===1,'INVALID_PARENT_COUNT');
      text(command.text,LIMITS.maxTextBytes);text(command.trigger,512);
    }
    if(['MATERIALIZE','OBSERVE','OPEN_UNKNOWN'].includes(command.type))identifier(command.stateId);
    if(command.type==='OPEN_UNKNOWN'){text(command.question,1024);text(command.reopenTrigger,512);}
    if(command.type==='REVISIT'){identifier(command.unknownId);text(command.evidence,1024);}
    if(command.type==='REANCHOR')identifier(command.snapshotId);
    return copy(command);
  }
  function emptyStore(){return {rawRecords:[],states:[],relations:[],materializations:[],observations:[],unknowns:[],revisits:[],snapshots:[],roots:[]};}
  const collection={RAW_TEXT:'rawRecords',STATE:'states',RELATION:'relations',MATERIALIZATION:'materializations',OBSERVATION:'observations',UNKNOWN:'unknowns',REVISIT:'revisits',SNAPSHOT:'snapshots',ROOT:'roots'};
  const prefixes={RAW_TEXT:'RAW',STATE:'S',RELATION:'REL',MATERIALIZATION:'MAT',OBSERVATION:'OBS',UNKNOWN:'U',REVISIT:'REV',SNAPSHOT:'SNAP',ROOT:'ROOT'};
  function collect(events){const store=emptyStore();for(const event of events)for(const record of event.records)store[collection[record.kind]].push(record);return store;}
  function heads(store){const active={};for(const m of store.materializations)active[m.entityId]=m.stateId;return active;}
  function find(rows,id,code){const row=rows.find(r=>r.id===id);assert(row,code);return row;}
  function endpoint(record,role='REFERENT'){
    return {role,kind:record.kind,id:record.id,digest:record.digest,semanticAddress:'/'+collection[record.kind]+'/'+record.id,referent:record.entityId||record.id,dimension:record.kind==='STATE'?'VERSIONED_TEXT_STATE':record.kind,scope:record.runId};
  }
  function project(runId,events,totalEvents=events.length){
    const s=collect(events),activeHeads=heads(s),materialized=new Map(s.materializations.map(m=>[m.stateId,m]));
    return {runId,sequence:events.length,totalEvents,isHistorical:events.length!==totalEvents,
      states:s.states.map(state=>({...copy(state),phase:materialized.has(state.id)?activeHeads[state.entityId]===state.id?'MATERIALIZED':'SUPERSEDED':state.initialPhase,materializedAt:materialized.get(state.id)?.sequence??null})),
      relations:copy(s.relations),rawRecords:copy(s.rawRecords),materializations:copy(s.materializations),observations:copy(s.observations),
      unknowns:s.unknowns.map(u=>({...copy(u),status:'OPEN',revisitCount:s.revisits.filter(r=>r.unknownId===u.id).length})),revisits:copy(s.revisits),snapshots:copy(s.snapshots),roots:copy(s.roots),
      events:copy(events),activeHeads:copy(activeHeads),activeRootId:s.roots.at(-1)?.id??null,
      counts:{events:events.length,states:s.states.length,entities:new Set(s.states.map(x=>x.entityId)).size,activeEntities:Object.keys(activeHeads).length,materializations:s.materializations.length,observations:s.observations.length,unknowns:s.unknowns.length,revisits:s.revisits.length,snapshots:s.snapshots.length,roots:s.roots.length,relations:s.relations.length},
      limits:copy(LIMITS),clock:copy(CLOCK)};
  }
  function create(options={}){
    assert(plain(options)&&Object.keys(options).every(k=>k==='runId'||k==='clock'),'INVALID_OPTIONS');
    const runId=options.runId===undefined?'GST_LOCAL':identifier(options.runId);assert(runId.length<=64,'RUN_ID_TOO_LONG');
    const clock=options.clock===undefined?()=>new Date().toISOString():options.clock;assert(typeof clock==='function','INVALID_CLOCK');
    let events=[],busy=false;
    function envelope(log=events){return {schema:'halveth.gstar.ledger.v1',version:VERSION,runId,definitions:copy(DEFINITIONS),limits:copy(LIMITS),clock:copy(CLOCK),events:copy(log),projection:project(runId,log),headDigest:log.at(-1)?.digest??null,claimCeiling:'LOCAL_TEXT_MODEL_AND_SELF_CONSISTENCY'};}
    async function dispatch(input){
      assert(!busy,'BUSY');busy=true;
      try{
        const command=validateCommand(input);assert(events.length<LIMITS.maxEvents,'EVENT_LIMIT');
        const recordedAt=iso(clock());assert(!events.length||recordedAt>=events.at(-1).recordedAt,'CLOCK_MOVED_BACKWARDS');
        const sequence=events.length+1,store=collect(events),records=[],activeHeads=heads(store);let outcome;
        const getState=id=>find(store.states,id,'UNKNOWN_STATE');
        async function add(kind,data){
          const list=store[collection[kind]],id=runId+':'+prefixes[kind]+String(list.length+1).padStart(4,'0');
          const body={schema:'halveth.gstar.record.v1',version:VERSION,kind,id,runId,sequence,recordedAt,modelTime:{kind:'EVENT_ORDINAL',value:sequence},...data};
          const record={...body,digest:'sha256:'+await digest(body)};list.push(record);records.push(record);return record;
        }
        function nextEntity(){return runId+':E'+String(new Set(store.states.map(s=>s.entityId)).size+1).padStart(4,'0');}
        async function newState(data){assert(store.states.length<LIMITS.maxStates,'STATE_LIMIT');return add('STATE',{...data,bornAt:sequence,definitionId:DEFINITIONS.genesis,equalityId:DEFINITIONS.equality});}
        if(command.type==='SEED'){
          assert(store.states.length<LIMITS.maxStates,'STATE_LIMIT');
          const raw=await add('RAW_TEXT',{text:command.text,encoding:'UTF-8',byteLength:encoder.encode(command.text).length,utf8Sha256:await hashText(command.text),provenance:'TEXT_PROVIDED_IN_THIS_LOCAL_SESSION',originalFileProvenance:'NOT_ASSERTED'});
          const state=await newState({entityId:nextEntity(),label:command.label,text:command.text,parents:[],entityParentCount:0,parentStateCount:0,parentKnowledge:'EXPLICIT_INITIALIZATION_NO_ENTITY_PARENT',mode:'INITIALIZE',initialPhase:'GERM',textRelation:'INITIAL_CONTENT',trigger:'EXPLICIT_SEED_COMMAND',inputRefs:[endpoint(raw,'CONTENT_INPUT')],environmentRef:'GSTAR_LOCAL_TEXT_RUNTIME_1'});
          await add('ROOT',{anchorRef:endpoint(state,'INITIAL_SEED'),originMode:'SEED_LOCAL_ANCHOR',localT0:sequence,absoluteOriginClaim:false});outcome='SEED_REGISTERED';
        }else if(command.type==='PROPOSE'){
          const parents=command.parents.map(getState);const parentEntities=new Set(parents.map(p=>p.entityId));assert(parentEntities.size===parents.length,'DUPLICATE_PARENT_ENTITY');
          const same=parents.map(p=>p.text===command.text);
          if(command.mode==='CLONE_INSTANCE')assert(same[0],'CLONE_REQUIRES_IDENTICAL_TEXT');
          if(command.mode==='REVISE')assert(activeHeads[parents[0].entityId]===parents[0].id,'REVISE_REQUIRES_CURRENT_MATERIALIZED_HEAD');
          if(['REVISE','DERIVE_CHILD'].includes(command.mode)&&same[0])outcome='NO_CHANGE';
          else{
            const state=await newState({entityId:command.mode==='REVISE'?parents[0].entityId:nextEntity(),label:parents.length===1?parents[0].label:'Komposition',text:command.text,
              parents:parents.map(p=>endpoint(p,'GENEALOGICAL_PARENT')),entityParentCount:parentEntities.size,parentStateCount:parents.length,parentKnowledge:'BOUND_PARENT_REFERENCES',mode:command.mode,initialPhase:'CANDIDATE',
              textRelation:same.every(Boolean)?parents.length===1?'IDENTICAL_TO_PARENT':'IDENTICAL_TO_ALL_PARENTS':same.some(Boolean)?'MATCHES_ONE_PARENT':'DIFFERS_FROM_ALL_PARENTS',
              trigger:command.trigger,inputRefs:parents.map(p=>endpoint(p,'STATE_INPUT')),environmentRef:'GSTAR_LOCAL_TEXT_RUNTIME_1'});
            for(const parent of parents)await add('RELATION',{relationType:'GENEALOGICAL_STATE_DERIVATION',definitionId:DEFINITIONS.relation,definitionVersion:VERSION,definitionContract:copy(RELATION_CONTRACT),definitionDigest:'sha256:'+await digest(RELATION_CONTRACT),leftEndpoint:endpoint(parent,'PARENT'),rightEndpoint:endpoint(state,'CHILD_STATE'),direction:'PARENT_TO_DERIVED_STATE',scope:runId,timeScope:'MODEL_EVENT_ORDINAL',algebra:copy(RELATION_CONTRACT.algebra),sourceCommandRef:{kind:'LOCAL_COMMAND',id:runId+':EV'+String(sequence).padStart(4,'0')+':COMMAND',digest:'sha256:'+await digest(command),semanticAddress:'/events/'+String(sequence-1)+'/command'},evidenceState:'LOCAL_OPERATION_RECORDED',authorityEffect:'LOCAL_MODEL_ONLY',writeDomainId:state.id+':FROM:'+parent.id});
            outcome='CANDIDATE_PROPOSED';
          }
        }else if(command.type==='MATERIALIZE'){
          const state=getState(command.stateId);assert(!store.materializations.some(m=>m.stateId===state.id),'ALREADY_MATERIALIZED');
          if(state.mode==='REVISE')assert(activeHeads[state.entityId]===state.parents[0].id,'STALE_REVISION');
          await add('MATERIALIZATION',{stateId:state.id,entityId:state.entityId,stateRef:endpoint(state,'MATERIALIZED_VERSION'),previousActiveStateId:activeHeads[state.entityId]??null,authorityEffect:'LOCAL_MODEL_ONLY',semanticTruth:'NOT_ASSERTED'});outcome='MATERIALIZED';
        }else if(command.type==='OBSERVE'){
          const state=getState(command.stateId);assert(store.materializations.some(m=>m.stateId===state.id),'STATE_NOT_MATERIALIZED');
          await add('OBSERVATION',{stateId:state.id,stateRef:endpoint(state,'OBSERVED_VERSION'),observedText:state.text,definitionId:DEFINITIONS.observation,observationScope:'BOUND_LOCAL_STATE_RECORD',outsideWorldTruth:'NOT_ASSERTED'});outcome='OBSERVATION_RECORDED';
        }else if(command.type==='OPEN_UNKNOWN'){
          const state=getState(command.stateId);assert(store.unknowns.length<LIMITS.maxUnknowns,'UNKNOWN_LIMIT');
          await add('UNKNOWN',{stateId:state.id,stateRef:endpoint(state,'QUESTION_TARGET'),question:command.question,reopenTrigger:command.reopenTrigger,initialStatus:'OPEN',evidenceState:'QUESTION_NOT_EVIDENCE'});outcome='UNKNOWN_OPENED';
        }else if(command.type==='REVISIT'){
          const unknown=find(store.unknowns,command.unknownId,'UNKNOWN_OBLIGATION');
          await add('REVISIT',{unknownId:unknown.id,unknownRef:endpoint(unknown,'REVISIT_TARGET'),evidence:command.evidence,evidenceStatus:'USER_DECLARED_NOT_VERIFIED',resolution:'OPEN_PENDING_REVIEW',authorityEffect:'LOCAL_ANNOTATION_ONLY'});outcome='REVISIT_RECORDED';
        }else if(command.type==='SNAPSHOT'){
          await add('SNAPSHOT',{prefixLength:events.length,prefixHeadDigest:events.at(-1)?.digest??null,stateRefs:store.states.map(s=>endpoint(s,'RETAINED_STATE')),activeHeads:copy(activeHeads),observationRefs:store.observations.map(o=>endpoint(o,'RETAINED_OBSERVATION')),unknownRefs:store.unknowns.map(u=>endpoint(u,'RETAINED_QUESTION')),definitionId:'EXPLICIT_PREFIX_SNAPSHOT_1'});outcome='SNAPSHOT_CAPTURED';
        }else if(command.type==='REANCHOR'){
          const snapshot=find(store.snapshots,command.snapshotId,'UNKNOWN_SNAPSHOT');
          await add('ROOT',{anchorRef:endpoint(snapshot,'PRESERVED_SNAPSHOT'),originMode:'EXPLICIT_SNAPSHOT_REANCHOR',localT0:sequence,absoluteOriginClaim:false});outcome='LOCAL_ROOT_REGISTERED';
        }
        const body={schema:'halveth.gstar.event.v1',version:VERSION,id:runId+':EV'+String(sequence).padStart(4,'0'),runId,sequence,modelTime:{kind:'EVENT_ORDINAL',value:sequence},recordedAt,command,outcome,records,previousDigest:events.at(-1)?.digest??null};
        const event={...body,digest:'sha256:'+await digest(body)};const candidate=events.concat(event);
        assert(encoder.encode(canonical(envelope(candidate))).length<=LIMITS.maxExportBytes,'EXPORT_LIMIT');
        events=candidate;return copy({event,outcome});
      }finally{busy=false;}
    }
    return Object.freeze({dispatch,view(sequence=events.length){assert(Number.isInteger(sequence)&&sequence>=0&&sequence<=events.length,'INVALID_HISTORY_SEQUENCE');return project(runId,events.slice(0,sequence),events.length);},export(){return envelope();}});
  }
  async function verifiedInstance(exported,options={}){
    json(exported);assert(encoder.encode(canonical(exported)).length<=LIMITS.maxExportBytes,'EXPORT_LIMIT');
    exact(exported,['schema','version','runId','definitions','limits','clock','events','projection','headDigest','claimCeiling']);
    assert(exported.schema==='halveth.gstar.ledger.v1'&&exported.version===VERSION,'UNSUPPORTED_EXPORT');
    assert(Array.isArray(exported.events)&&exported.events.length<=LIMITS.maxEvents,'INVALID_EVENT_LOG');
    let replayIndex=0,replaying=true;
    const liveClock=options.clock===undefined?()=>new Date().toISOString():options.clock;assert(typeof liveClock==='function','INVALID_CLOCK');
    // Read the complete input before awaiting: no mutable import aliases survive.
    const bound=copy(exported);
    // The replay clock also uses the bound copy, not caller-controlled records.
    const result=create({runId:bound.runId,clock:()=>replaying?bound.events[replayIndex++].recordedAt:liveClock()});
    for(const supplied of bound.events){exact(supplied,['schema','version','id','runId','sequence','modelTime','recordedAt','command','outcome','records','previousDigest','digest']);const {event}=await result.dispatch(supplied.command);assert(canonical(event)===canonical(supplied),'EVENT_REPLAY_MISMATCH');}
    assert(canonical(result.export())===canonical(bound),'EXPORT_REPLAY_MISMATCH');replaying=false;return result;
  }
  async function verify(exported){const result=await verifiedInstance(exported);const view=result.view();return {valid:true,events:view.counts.events,states:view.counts.states,headDigest:result.export().headDigest,scope:'LOCAL_MODEL_AND_SELF_CONSISTENCY'};}
  async function restore(exported,options={}){assert(plain(options)&&Object.keys(options).every(k=>k==='clock'),'INVALID_OPTIONS');return verifiedInstance(exported,options);}
  const api=Object.freeze({VERSION,LIMITS,DEFINITIONS,create,canonical,digest,verify,restore});root.GStar=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
