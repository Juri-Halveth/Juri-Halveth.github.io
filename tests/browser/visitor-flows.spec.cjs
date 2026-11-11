'use strict';
const {test,expect}=require('@playwright/test');

const languages=[
 {lang:'de',prefix:'/',count:n=>`${n} von 13 Projekten`},
 {lang:'en',prefix:'/en/',count:n=>`${n} of 13 projects`},
 {lang:'ru',prefix:'/ru/',count:n=>`Проекты: ${n} из 13`}
];

test('search and category input produce visible results and an empty state with a working reset',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 for(const {lang,prefix,count} of languages){
  await test.step(`${lang}: load the real module, search, filter and return to all projects`,async()=>{
   const moduleResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/project-finder.mjs');
   const response=await page.goto(`${prefix}arbeiten/`);
   expect(response.status()).toBe(200);
   expect((await moduleResponse).status()).toBe(200);
   const search=page.getByRole('searchbox');
   const visibleCards=page.locator('[data-project]:visible');
   const countLabel=page.getByRole('status');
   const empty=page.locator('#project-empty');
   await expect(visibleCards).toHaveCount(13);
   // The generated HTML has different text; this confirms browser initialization.
   await expect(countLabel).toHaveText(count(13));
   await search.fill('sCaRlEt');
   await expect(visibleCards).toHaveCount(1);
   await expect(visibleCards).toHaveAttribute('data-project','halveth-scarlet');
   await expect(countLabel).toHaveText(count(1));
   await expect(empty).toBeHidden();

   await search.fill('');
   await page.locator('.category-toggle summary').click();
   const learning=page.locator('[data-project-filter="learning"]');
   await learning.click();
   await expect(learning).toHaveAttribute('aria-pressed','true');
   await expect(visibleCards).toHaveCount(2);
   await expect(page.locator('[data-project]:visible:not([data-category="learning"])')).toHaveCount(0);
   await expect(countLabel).toHaveText(count(2));

   await search.fill('no-project-has-this-name');
   await expect(visibleCards).toHaveCount(0);
   await expect(countLabel).toHaveText(count(0));
   await expect(empty).toBeVisible();
   await empty.getByRole('button').click();
   await expect(search).toHaveValue('');
   await expect(search).toBeFocused();
   await expect(visibleCards).toHaveCount(13);
   await expect(countLabel).toHaveText(count(13));
   await expect(empty).toBeHidden();
   await expect(page.locator('[data-project-filter="all"]')).toHaveAttribute('aria-pressed','true');
   await expect(page).toHaveURL(`${prefix}arbeiten/`);
  });
 }
 expect(errors).toEqual([]);
});

test('a retired URL remains a 404 and every language offers working project and work-sample links',async({page})=>{
 const missing='/en/schuelervz-halveth/index.html';
 const response=await page.goto(missing);
 expect(response.status()).toBe(404);
 await expect(page).toHaveTitle(/404/);
 await expect(page).toHaveURL(missing);
 for(const {lang,prefix} of languages){
  for(const route of ['arbeiten/','belege/']){
   await test.step(`${lang}: follow ${route} and return to the missing URL`,async()=>{
    const destination=`${prefix}${route}`;
    const navigation=page.waitForResponse(response=>response.request().isNavigationRequest()&&new URL(response.url()).pathname===destination);
    await page.locator(`section[lang="${lang}"] a[href="${destination}"]`).click();
    expect((await navigation).status()).toBe(200);
    await expect(page).toHaveURL(destination);
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    if(route==='arbeiten/')await expect(page.locator('[data-project]:visible')).toHaveCount(13);
    await page.goBack();
    await expect(page).toHaveURL(missing);
    await expect(page).toHaveTitle(/404/);
   });
  }
 }
});
