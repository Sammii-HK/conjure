import test from "node:test";
import assert from "node:assert/strict";
import {getSchema} from "better-auth/db";
import {Prisma} from "@prisma/client";
test("updated auth core fields exist in checked-out Prisma client metadata without connecting",()=>{
 const models=Prisma.dmmf.datamodel.models;
 const schema=getSchema({emailAndPassword:{enabled:true},socialProviders:{google:{clientId:"fixture",clientSecret:"fixture"}}});
 for(const [name,table] of Object.entries(schema)){
  const model=models.find(item=>item.name.toLowerCase()===name.toLowerCase());
  assert.ok(model,`Missing auth model ${name}`);
  for(const field of Object.keys(table.fields))assert.ok(model.fields.some(item=>item.name===field),`Missing ${name}.${field}`);
 }
});

import {betterAuth} from "better-auth";
import {memoryAdapter} from "better-auth/adapters/memory";
test("updated auth signs in and resolves a session against in-memory fixture IO",async()=>{
 const fixture={user:[],session:[],account:[],verification:[]};
 const auth=betterAuth({baseURL:"https://conjure.test",secret:"local-fixture-only-secret-at-least-32-characters",database:memoryAdapter(fixture),emailAndPassword:{enabled:true},telemetry:{enabled:false}});
 const response=await auth.handler(new Request("https://conjure.test/api/auth/sign-up/email",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://conjure.test"},body:JSON.stringify({name:"Fixture",email:"fixture@example.test",password:"fixture-password-1234"})}));
 assert.equal(response.status,200,await response.clone().text());
 const cookies=response.headers.getSetCookie().map(value=>value.split(";")[0]).join("; ");
 const session=await auth.api.getSession({headers:new Headers({cookie:cookies})});
 assert.equal(session?.user.email,"fixture@example.test");
 assert.equal(fixture.user.length,1);
 assert.equal(fixture.session.length,1);
});

import {createRequire} from "node:module";
test("auth router receives its required Zod4 peer while application keeps Zod3",()=>{
 const authRequire=createRequire(import.meta.resolve("better-auth"));
 const coreRequire=createRequire(authRequire.resolve("@better-auth/core"));
 const routerRequire=createRequire(coreRequire.resolve("better-call"));
 assert.match(routerRequire("zod/package.json").version,/^4\./);
 const appRequire=createRequire(import.meta.url);
 assert.match(appRequire("zod/package.json").version,/^3\./);
});
