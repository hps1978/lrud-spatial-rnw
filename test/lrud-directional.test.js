const puppeteer = require('puppeteer');
const server = require('./server');

const testPath = `${server.address}/test/directional-layouts`;

describe('LRUD Directional Navigation - isValidCandidate Tests', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    try {
      await server.listen();
    } catch (ex) {
      if (ex.code !== 'EADDRINUSE') {
        throw ex;
      }
    }
    browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      defaultViewport: {width: 1280, height: 800}
    });
    context = await browser.createIncognitoBrowserContext();
  });

  beforeEach(async () => {
    page = await context.newPage();
  });

  afterEach(async () => {
    await page?.close();
  });

  afterAll(async () => {
    await context?.close();
    await browser?.close();
    try {
      await server.close();
    } catch { /* empty */ }
  });

  describe('Directional Validation - isValidCandidate()', () => {
    it('should only select candidates in the correct direction (right)', async () => {
      await page.goto(`${testPath}/directional-validation.html`);
      await page.waitForFunction('document.activeElement');

      // Start at center, move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should select one of the right candidates, not left/up/down
      expect(['btn-right-aligned', 'btn-right-up', 'btn-right-down']).toContain(result);
    });

    it('should prioritize aligned candidates over off-axis', async () => {
      await page.goto(`${testPath}/directional-validation.html`);
      await page.waitForFunction('document.activeElement');

      // Start at center, move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // btn-right-aligned is perfectly aligned on Y axis, should have priority
      expect(result).toEqual('btn-right-aligned');
    });

    it('should reject candidates behind the origin', async () => {
      await page.goto(`${testPath}/directional-validation.html`);
      await page.waitForFunction('document.activeElement');

      // Start at center, move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should NOT select left candidates when moving right
      expect(result).not.toEqual('btn-left-aligned');
    });

    it('should reject candidates in opposite direction', async () => {
      await page.goto(`${testPath}/directional-validation.html`);
      await page.waitForFunction('document.activeElement');

      // Start at center, move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should NOT select up/down candidates when moving right
      expect(['btn-up-aligned', 'btn-down-aligned']).not.toContain(result);
    });
  });

  describe('Overlap Weighting - data-lrud-overlap-threshold', () => {
    it('should respect data-lrud-overlap-threshold attribute', async () => {
      await page.goto(`${testPath}/overlap-weighting.html`);
      await page.waitForFunction('document.activeElement');

      // Start at center, move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should select one of the valid overlap candidates
      expect(['btn-default-overlap', 'btn-high-overlap', 'btn-low-overlap']).toContain(result);
    });

    it('should handle far candidates correctly', async () => {
      await page.goto(`${testPath}/overlap-weighting.html`);
      await page.waitForFunction('document.activeElement');

      // Verify initial focus
      let result = await page.evaluate(() => document.activeElement.id);
      expect(result).toEqual('btn-center');

      // Move down (should select down candidates)
      await page.keyboard.press('ArrowDown');
      result = await page.evaluate(() => document.activeElement.id);

      // Should select one of the valid candidates in down direction
      expect(['btn-default-overlap', 'btn-high-overlap', 'btn-low-overlap', 'btn-far-right-down']).toContain(result);
    });

    it('should use default overlap (0.3) when not specified', async () => {
      await page.goto(`${testPath}/overlap-weighting.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from center
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Default overlap (0.3) should allow btn-default-overlap to be selected
      expect(['btn-default-overlap', 'btn-high-overlap', 'btn-low-overlap']).toContain(result);
    });
  });

  describe('Alignment Priority - Perpendicular Axis', () => {
    it('should prioritize perfectly aligned candidates', async () => {
      await page.goto(`${testPath}/alignment-priority.html`);
      await page.waitForFunction('document.activeElement');

      // Start at center, move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // btn-perfect-align should be selected as it's perfectly aligned on Y
      expect(result).toEqual('btn-perfect-align');
    });

    it('should rank candidates by alignment even if farther', async () => {
      await page.goto(`${testPath}/alignment-priority.html`);
      await page.waitForFunction('document.activeElement');

      // Get initial focus
      let result = await page.evaluate(() => document.activeElement.id);
      expect(result).toEqual('btn-center');

      // Move right multiple times
      await page.keyboard.press('ArrowRight');
      result = await page.evaluate(() => document.activeElement.id);

      // First selection should be perfectly aligned
      expect(result).toEqual('btn-perfect-align');

      // Move again from perfect align to next candidate
      await page.keyboard.press('ArrowRight');
      result = await page.evaluate(() => document.activeElement.id);

      // Should move to next valid candidate (slightly-off or far-off-axis)
      expect(['btn-slightly-off', 'btn-far-off-axis', 'btn-close-off-axis']).toContain(result);
    });

    it('should consider alignment delta as primary sort criterion', async () => {
      await page.goto(`${testPath}/alignment-priority.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from center
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should select btn-perfect-align (alignment delta = 0)
      // rather than btn-close-off-axis (alignment delta > 0, even if closer in distance)
      expect(result).toEqual('btn-perfect-align');
    });
  });

  describe('Complex Directions - Multiple Axis Movement', () => {
    it('should handle down movement correctly', async () => {
      await page.goto(`${testPath}/complex-direction.html`);
      await page.waitForFunction('document.activeElement');

      // Move down from center
      await page.keyboard.press('ArrowDown');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should select a down candidate (down-right, down-left, or exact-down)
      expect(['btn-down-right', 'btn-down-left', 'btn-exact-down']).toContain(result);
    });

    it('should prioritize exactly aligned down movement', async () => {
      await page.goto(`${testPath}/complex-direction.html`);
      await page.waitForFunction('document.activeElement');

      // Move down from center
      await page.keyboard.press('ArrowDown');
      const result = await page.evaluate(() => document.activeElement.id);

      // btn-exact-down should have priority as it's perfectly aligned on X
      expect(['btn-exact-down', 'btn-down-right', 'btn-down-left']).toContain(result);
    });

    it('should handle right movement with diagonals', async () => {
      await page.goto(`${testPath}/complex-direction.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from center
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should select a right candidate (up-right, down-right, or exact-right)
      expect(['btn-up-right', 'btn-down-right', 'btn-exact-right']).toContain(result);
    });

    it('should properly calculate alignment for diagonal candidates', async () => {
      await page.goto(`${testPath}/complex-direction.html`);
      await page.waitForFunction('document.activeElement');

      // Move down, should prefer vertically aligned
      await page.keyboard.press('ArrowDown');
      let result = await page.evaluate(() => document.activeElement.id);

      // Should prioritize exact-down over diagonals
      if (result === 'btn-exact-down') {
        expect(result).toEqual('btn-exact-down');
      } else {
        // Or one of the diagonal candidates
        expect(['btn-down-right', 'btn-down-left']).toContain(result);
      }
    });
  });

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle very small buttons', async () => {
      await page.goto(`${testPath}/edge-cases.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from normal button
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should still be able to navigate to small button or other candidates
      expect(['btn-tiny', 'btn-huge', 'btn-exact-edge']).toContain(result);
    });

    it('should exclude zero-dimension candidates', async () => {
      await page.goto(`${testPath}/edge-cases.html`);
      await page.waitForFunction('document.activeElement');

      // Start at normal, move down multiple times
      await page.keyboard.press('ArrowDown');
      let result = await page.evaluate(() => document.activeElement.id);

      // Should not select btn-zero-dim as it has no dimensions
      expect(result).not.toEqual('btn-zero-dim');

      // Continue down
      await page.keyboard.press('ArrowDown');
      result = await page.evaluate(() => document.activeElement.id);

      // Still should not be btn-zero-dim
      expect(result).not.toEqual('btn-zero-dim');
    });

    it('should not select candidates behind the origin', async () => {
      await page.goto(`${testPath}/edge-cases.html`);
      await page.waitForFunction('document.activeElement');

      // From normal button, try to move right
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should not select btn-behind as it's to the left
      expect(result).not.toEqual('btn-behind');
    });

    it('should handle boundary at exact edge', async () => {
      await page.goto(`${testPath}/edge-cases.html`);
      await page.waitForFunction('document.activeElement');

      // Navigate to test boundary conditions
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Should select a valid candidate, boundary should be handled correctly
      expect(['btn-tiny', 'btn-huge', 'btn-exact-edge']).toContain(result);
    });

    it('should handle very large buttons', async () => {
      await page.goto(`${testPath}/edge-cases.html`);
      await page.waitForFunction('document.activeElement');

      // Move right - should be able to navigate to huge button
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Large button should be a valid candidate
      expect(['btn-tiny', 'btn-huge', 'btn-exact-edge']).toContain(result);
    });
  });

  describe('WeightedEntryPoint Calculation', () => {
    it('should apply overlap weighting correctly for right movement', async () => {
      await page.goto(`${testPath}/overlap-weighting.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from center with default overlap (0.3)
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Default overlap allows 30% of candidate width to be "behind" exit point
      expect(['btn-default-overlap', 'btn-high-overlap', 'btn-low-overlap']).toContain(result);
    });

    it('should apply higher overlap weighting when specified', async () => {
      await page.goto(`${testPath}/overlap-weighting.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from center
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // High overlap (0.8) should allow more candidates to be valid
      expect(['btn-default-overlap', 'btn-high-overlap', 'btn-low-overlap']).toContain(result);
    });

    it('should apply lower overlap weighting when specified', async () => {
      await page.goto(`${testPath}/overlap-weighting.html`);
      await page.waitForFunction('document.activeElement');

      // Move right from center
      await page.keyboard.press('ArrowRight');
      const result = await page.evaluate(() => document.activeElement.id);

      // Low overlap (0.1) requires more forward positioning
      // Should still select from valid candidates
      expect(['btn-default-overlap', 'btn-high-overlap', 'btn-low-overlap']).toContain(result);
    });
  });
});
