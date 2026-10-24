import { test, expect } from '@playwright/test';

test('manual points persist independently of rounds, support correction and reset', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Team 1 minus 1 Punkt' })).toBeDisabled();
  await page.getByRole('button', { name: 'Teams & Gegenstände' }).click();
  await page.getByLabel('Team 1', { exact: true }).fill('Anna');
  await page.getByRole('button', { name: 'Zum Spielfeld' }).click();
  await page.getByRole('button', { name: 'Runde 1 starten' }).click();
  await page.getByRole('button', { name: 'Anna plus 1 Punkt' }).click();
  await page.getByRole('button', { name: 'Anna plus 1 Punkt' }).click();
  await page.getByRole('button', { name: 'Anna minus 1 Punkt' }).click();
  await expect(page.getByRole('heading', { name: 'Eine Rolle Klopapier' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Anna Punktestand', { exact: true })).toHaveText('1');
  await page.getByRole('button', { name: 'Nächste Runde' }).click();
  await expect(page.getByRole('heading', { name: 'Eine Zigarettenschachtel' })).toBeVisible();
  await page.getByRole('button', { name: 'Vorherige Runde' }).click();
  await expect(page.getByRole('heading', { name: 'Eine Rolle Klopapier' })).toBeVisible();
  await expect(page.getByLabel('Anna Punktestand', { exact: true })).toHaveText('1');
  for (let i = 1; i < 15; i++) await page.getByRole('button', { name: 'Nächste Runde' }).click();
  await page.getByRole('button', { name: 'Spiel beenden' }).click();
  await expect(page.getByRole('heading', { name: 'Anna', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Team 2 plus 1 Punkt' }).click();
  await expect(page.getByText('GLEICHSTAND', { exact: true })).toBeVisible();
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Neues Spiel', exact: true }).first().click();
  await expect(page.getByLabel('Anna Punktestand', { exact: true })).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Runde 1 starten' })).toBeVisible();
});

test('all pictures load, old scores migrate and reveal fits desktop and mobile', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const key = 'jubilaeum-brings-mit-v1';
    const game = JSON.parse(localStorage.getItem(key)!);
    delete game.images; delete game.scores;
    game.items[14] = 'Einen Gegenstand mit Herz';
    game.results = [0, 0, 1];
    localStorage.setItem(key, JSON.stringify(game));
  });
  await page.reload();
  await expect(page.getByLabel('Team 1 Punktestand', { exact: true })).toHaveText('2');
  await expect(page.getByLabel('Team 2 Punktestand', { exact: true })).toHaveText('1');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Vorherige Runde' }).click();
  await expect(page.getByLabel('Team 1 Punktestand', { exact: true })).toHaveText('2');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const image = page.locator('.item-image');
    const box = await image.boundingBox();
    expect(box!.height).toBeGreaterThan(150);
    const next = await page.getByRole('button', { name: 'Nächste Runde' }).boundingBox();
    const stage = await page.locator('.hunt-stage').boundingBox();
    expect(next!.y + next!.height).toBeLessThanOrEqual(stage!.y + stage!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  for (let round = 1; round <= 15; round++) {
    const picture = page.locator('.item-image');
    await expect(picture).toHaveAttribute('data-source', `/items/${round}.svg`);
    if (round === 15) {
      await expect(page.getByRole('heading', { name: 'Ein Bier', exact: true })).toBeVisible();
      await expect(picture).toHaveAttribute('src', '/items/beer-photo.png');
      await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await expect(picture).toHaveAttribute('alt', 'Ein Bier');
    } else {
    await expect.poll(() => picture.locator('image').evaluate(async (el: SVGImageElement) => { const img = new Image(); img.src = el.href.baseVal; try { await img.decode(); return img.naturalWidth === 1619; } catch { return false; } })).toBe(true);
    await expect(picture).toHaveAttribute('aria-label', await page.locator('.item-reveal h2').innerText());
    }
    await page.getByRole('button', { name: round === 15 ? 'Spiel beenden' : 'Nächste Runde' }).click();
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
  await expect(page.locator('.item-thumbnail').first()).toHaveAttribute('data-source', '/items/1.svg');
});
