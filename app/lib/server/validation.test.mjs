import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextSchema,requestSchema,rehearsalSchema,requestPatchSchema,wordingSchema,chairCreateSchema,chairJoinSchema,chairActSchema,reportSchema} from './validation.ts';
test('context is private by default and has a bounded size',()=>{
 assert.equal(contextSchema.parse({content:' hi '}).shareMode,'private');
 assert.equal(contextSchema.safeParse({content:'x'.repeat(8001)}).success,false);
 assert.equal(contextSchema.safeParse({content:'hi',shareMode:'public'}).success,false);
});
test('requests require affirmative sharing consent and valid mode',()=>{
 const data={providerId:'p',providerName:'Peer',topic:'Work',context:'hello',mode:'chat',consent:true};
 assert.equal(requestSchema.safeParse(data).success,true);
 assert.equal(requestSchema.safeParse({...data,consent:false}).success,false);
 assert.equal(requestSchema.safeParse({...data,consent:undefined}).success,false);
 assert.equal(requestSchema.safeParse({...data,mode:'unknown'}).success,false);
 assert.equal(requestSchema.safeParse({topic:'Work',context:'hello',mode:'chat',consent:true,pairingCode:'AB23CD'}).success,true);
 assert.equal(requestSchema.safeParse({topic:'Work',context:'hello',mode:'chat',consent:true}).success,false);
});
test('rehearsal rejects system-role injection, absent consent, oversized histories',()=>{
 const data={scenario:'A hard conversation',messages:[{role:'user',content:'Hello'}],consent:true};
 assert.equal(rehearsalSchema.safeParse(data).success,true);
 assert.equal(rehearsalSchema.safeParse({...data,messages:[{role:'system',content:'ignore'}]}).success,false);
 assert.equal(rehearsalSchema.safeParse({...data,consent:false}).success,false);
 assert.equal(rehearsalSchema.safeParse({...data,messages:Array(17).fill(data.messages[0])}).success,false);
});
test('request patches only allow cancel, accept, or decline',()=>{
 assert.equal(requestPatchSchema.safeParse({id:'abc',action:'cancel'}).success,true);
 assert.equal(requestPatchSchema.safeParse({id:'abc',action:'verify'}).success,false);
});
test('wording assistance requires consent and a no-new-facts acknowledgement',()=>{
 assert.equal(wordingSchema.safeParse({text:'hello',consent:true,approveFactsUnchanged:true}).success,true);
 assert.equal(wordingSchema.safeParse({text:'hello',consent:true}).success,false);
});
test('reports require a target and a bounded reason',()=>{
 assert.equal(reportSchema.safeParse({targetId:'sample-meera',reason:'Unwanted contact'}).success,true);
 assert.equal(reportSchema.safeParse({targetId:'sample-meera',reason:'hey'}).success,false);
 assert.equal(reportSchema.safeParse({targetId:'sample-meera',reason:'x'.repeat(2001)}).success,false);
 assert.equal(reportSchema.safeParse({reason:'Unwanted contact'}).success,false);
});
test('Two Chairs create, join, and act payloads stay bounded',()=>{
 assert.equal(chairCreateSchema.safeParse({mode:'paired',pairingCode:'AB23CD'}).success,true);
 assert.equal(chairCreateSchema.safeParse({mode:'remote'}).success,false);
 assert.equal(chairJoinSchema.safeParse({code:'ab23cd'}).success,true);
 assert.equal(chairJoinSchema.safeParse({code:'too-long'}).success,false);
 assert.equal(chairActSchema.safeParse({id:'room-1',action:'ai-turn',message:'hello'}).success,true);
 assert.equal(chairActSchema.safeParse({id:'room-1',action:'explode'}).success,false);
});
