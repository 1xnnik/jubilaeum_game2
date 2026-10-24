import { test, expect } from '@playwright/test';
test('15 rounds, one point each, persistence, undo and final result', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Eine Rolle Klopapier' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Teams & Gegenstände' }).click();
  await page.getByLabel('Team 1', { exact: true }).fill('Anna');
  await page.getByLabel('Runde 1', { exact: true }).fill('Einen roten Schuh');
  await page.getByRole('button', { name: 'Zum Spielfeld' }).click();
  await page.getByRole('button', { name: 'Runde 1 starten' }).click();
  await expect(page.getByRole('heading', { name: 'Einen roten Schuh' })).toBeVisible();
  await page.getByRole('button', { name: 'Anna +1' }).click();
  await page.reload();
  await expect(page.locator('.team-card').first().locator('.score')).toHaveText('1');
  await page.getByRole('button', { name: 'Letzte Wertung zurücknehmen' }).click();
  await expect(page.locator('.team-card').first().locator('.score')).toHaveText('0');
  await expect(page.getByRole('heading', { name: 'Einen roten Schuh' })).toBeVisible();
  await page.getByRole('button', { name: 'Anna +1' }).click();
  for (let round = 2; round <= 15; round++) {
    await page.getByRole('button', { name: `Runde ${round} starten` }).click();
    await page.getByRole('button', { name: 'Anna +1' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Anna', exact: true })).toBeVisible();
  await expect(page.locator('.team-card').first().locator('.score')).toHaveText('15');
  await expect(page.getByRole('button', { name: /Runde 16/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Rundenverlauf' }).click();
  await expect(page.locator('.history li')).toHaveCount(15);
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Neues Spiel', exact: true }).click();
  await expect(page.locator('.team-card').first().locator('.score')).toHaveText('0');
  await page.getByRole('button', { name: 'Runde 1 starten' }).click();
  await expect(page.getByRole('heading', { name: 'Einen roten Schuh' })).toBeVisible();
});
test('skip, locked editing, tie and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Runde 1 starten' }).click();
  await page.getByRole('button', { name: 'Teams & Gegenstände' }).click();
  await expect(page.getByLabel('Runde 1', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Zum Spielfeld' }).click();
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: /Niemand gefunden/ }).click();
  for (let round = 2; round <= 15; round++) {
    await page.getByRole('button', { name: `Runde ${round} starten` }).click();
    await page.getByRole('button', { name: `Team ${round % 2 + 1} +1` }).click();
  }
  await expect(page.getByText('GLEICHSTAND AN DER SPITZE')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team 1 & Team 2', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('reveals a loaded picture with every heading and migrates old saves', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const key = 'jubilaeum-brings-mit-v1';
    const game = JSON.parse(localStorage.getItem(key)!);
    delete game.images;
    localStorage.setItem(key, JSON.stringify(game));
  });
  await page.reload();
  await expect(page.locator('.item-image')).toHaveCount(0);
  for (let round = 1; round <= 15; round++) {
    await page.getByRole('button', { name: `Runde ${round} starten` }).click();
    const picture = page.locator('.item-image');
    await expect(picture).toBeVisible();
    await expect(picture).toHaveAttribute('src', `/items/${round}.svg`);
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const title = await page.locator('.item-reveal h2').innerText();
    await expect(picture).toHaveAttribute('alt', title);
    await page.getByRole('button', { name: 'Team 1 +1' }).click();
  }
});

test('custom uploaded picture survives reload and can be restored', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Teams & Gegenstände' }).click();
  const png = await page.screenshot();
  await page.getByLabel('Bild für Runde 1', { exact: true }).setInputFiles({ name: 'picture.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.item-thumbnail').first()).toHaveAttribute('src', /^data:image\/webp/);
  await page.reload();
  await page.getByRole('button', { name: 'Teams & Gegenstände' }).click();
  await expect(page.locator('.item-thumbnail').first()).toHaveAttribute('src', /^data:image\/webp/);
  await page.getByRole('button', { name: 'Zum Spielfeld' }).click();
  await page.getByRole('button', { name: 'Runde 1 starten' }).click();
  await expect(page.locator('.item-image')).toHaveAttribute('src', /^data:image\/webp/);
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Neues Spiel', exact: true }).click();
  await page.getByRole('button', { name: 'Teams & Gegenstände' }).click();
  await page.getByRole('button', { name: 'Standardbild verwenden' }).first().click();
  await expect(page.locator('.item-thumbnail').first()).toHaveAttribute('src', '/items/1.svg');
});
