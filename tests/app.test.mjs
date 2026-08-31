import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
test("ships the Vite PWA shell",async()=>{const [html,manifest,sw]=await Promise.all([readFile(new URL("../index.html",import.meta.url),"utf8"),readFile(new URL("../public/manifest.webmanifest",import.meta.url),"utf8"),readFile(new URL("../public/sw.js",import.meta.url),"utf8")]);assert.match(html,/Humza’s Qaida Quest/);assert.match(html,/viewport-fit=cover/);assert.equal(JSON.parse(manifest).display,"standalone");assert.match(sw,/caches\.open/)});
test("includes learning, games, rewards and parent controls",async()=>{const page=await readFile(new URL("../src/App.tsx",import.meta.url),"utf8");for(const feature of ["localStorage.setItem","Goalkeeper","Dot Detective","Mistake Busters","Parent PIN","ا ب ت ث","Quranic word reading","Reward shop"])assert.match(page,new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")))});
