import {copyFile,readFile,access} from "node:fs/promises";
for(const file of ["manifest.json","content.css"])await copyFile(file,`dist/${file}`);
const manifest=JSON.parse(await readFile("dist/manifest.json","utf8"));
for(const file of [...manifest.content_scripts.flatMap(item=>[...item.js,...item.css]),manifest.action.default_popup,"panel/index.html","panel.js"])await access(`dist/${file}`);
const content=await readFile("dist/content.js","utf8");
if(/^import\s|^export\s/m.test(content))throw Error("Content script must be self contained");
if(content.includes("localhost"))throw Error("Production extension must not embed localhost");
console.log("Verified packaged manifest, panel, popup and standalone content script.");
