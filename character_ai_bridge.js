const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const CHARACTER_URL = 'https://share.character.ai/Wv9R/3ikxx0ax'; // jouw bot
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

let browser, page;

async function startBrowser() {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto('https://beta.character.ai/login');

  await page.type('input[name="username"]', EMAIL);
  await page.type('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.goto(CHARACTER_URL);
  await page.waitForSelector('textarea');
}

async function askBot(message) {
  await page.type('textarea', message);
  await page.keyboard.press('Enter');

  await page.waitForFunction(() => {
    const replies = [...document.querySelectorAll('[data-source="ai"]')];
    return replies.length > 0 && replies[replies.length - 1].innerText.trim().length > 0;
  }, { timeout: 15000 });

  const replies = await page.$$eval('[data-source="ai"]', nodes =>
    nodes.map(n => n.innerText.trim())
  );

  return replies[replies.length - 1];
}

app.post('/ask', async (req, res) => {
  const { message } = req.body;
  if (!browser) await startBrowser();
  const reply = await askBot(message);
  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
