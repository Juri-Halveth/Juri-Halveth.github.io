'use strict';
const {defineConfig}=require('@playwright/test');

module.exports=defineConfig({
 testDir:'./tests/browser',
 testMatch:'**/*.spec.cjs',
 forbidOnly:!!process.env.CI,
 workers:1,
 retries:0,
 reporter:'list',
 use:{browserName:'chromium',baseURL:'http://127.0.0.1:4187'},
 webServer:{
  command:'npm run preview',
  env:{SPACE_PORT:'4187'},
  url:'http://127.0.0.1:4187/',
  reuseExistingServer:false,
  timeout:15000
 }
});
