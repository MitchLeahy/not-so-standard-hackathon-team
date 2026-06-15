import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// ── Templated configuration (resolved by `databricks apps init`) ────────────
const APP_CONFIG = {
  name: 'Health Access Agent',
} as const;

// ── Tests ───────────────────────────────────────────────────────────────────

let testArtifactsDir: string;
let consoleLogs: string[] = [];
let consoleErrors: string[] = [];
let pageErrors: string[] = [];
let failedRequests: string[] = [];

test('smoke test - app loads and displays home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: APP_CONFIG.name })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CareGap Command Center' })).toBeVisible();
  await expect(page.getByText('Medical desert queue')).toBeVisible();
  await expect(page.getByText('India access intelligence map')).toBeVisible();
  await expect(page.getByText('Evidence & trust desk')).toBeVisible();
  await expect(page.getByText('Repaired table contract')).toBeVisible();
  await expect(page.getByText('Validated reach')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scenario simulator' })).toBeVisible();
  await expect(page.getByText('Facility claim extraction', { exact: true })).toBeVisible();
  await expect(page.getByText('Contradiction flags', { exact: true })).toBeVisible();
  await expect(page.getByText('Data repair ledger')).toBeVisible();
  await expect(page.getByText('Impact tracker')).toBeVisible();
  await expect(page.getByText('Official boundary limitation')).toBeVisible();
  await expect(page.getByText('Facility dedupe and readiness')).toBeVisible();
  await expect(page.getByText('deduped facility profiles').first()).toBeVisible();
  await expect(page.getByText('service-ready facilities').first()).toBeVisible();
  await expect(page.getByText('quality warnings').first()).toBeVisible();
  await expect(page.getByText('Recommended planner note')).toBeVisible();
});

// ── Lifecycle hooks ─────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  consoleLogs = [];
  consoleErrors = [];
  pageErrors = [];
  failedRequests = [];

  // Create temp directory for test artifacts
  testArtifactsDir = join(process.cwd(), '.smoke-test');
  mkdirSync(testArtifactsDir, { recursive: true });

  // Capture console logs and errors (including React errors)
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();

    // Skip empty lines and formatting placeholders
    if (!text.trim() || /^%[osd]$/.test(text.trim())) {
      return;
    }

    // Get stack trace for errors if available
    const location = msg.location();
    const locationStr = location.url ? ` at ${location.url}:${location.lineNumber}:${location.columnNumber}` : '';

    consoleLogs.push(`[${type}] ${text}${locationStr}`);

    // Separately track error messages (React errors appear here)
    if (type === 'error') {
      consoleErrors.push(`${text}${locationStr}`);
    }
  });

  // Capture page errors with full stack trace
  page.on('pageerror', (error) => {
    const errorDetails = `Page error: ${error.message}\nStack: ${error.stack || 'No stack trace available'}`;
    pageErrors.push(errorDetails);
    // Also log to console for immediate visibility
    console.error('Page error detected:', errorDetails);
  });

  // Capture failed requests
  page.on('requestfailed', (request) => {
    failedRequests.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const testName = testInfo.title.replace(/ /g, '-').toLowerCase();
  // Always capture artifacts, even if test fails
  const screenshotPath = join(testArtifactsDir, `${testName}-app-screenshot.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const logsPath = join(testArtifactsDir, `${testName}-console-logs.txt`);
  const allLogs = [
    '=== Console Logs ===',
    ...consoleLogs,
    '\n=== Console Errors (React errors) ===',
    ...consoleErrors,
    '\n=== Page Errors ===',
    ...pageErrors,
    '\n=== Failed Requests ===',
    ...failedRequests,
  ];
  writeFileSync(logsPath, allLogs.join('\n'), 'utf-8');

  console.log(`Screenshot saved to: ${screenshotPath}`);
  console.log(`Console logs saved to: ${logsPath}`);
  if (consoleErrors.length > 0) {
    console.log('Console errors detected:', consoleErrors);
  }
  if (pageErrors.length > 0) {
    console.log('Page errors detected:', pageErrors);
  }
  if (failedRequests.length > 0) {
    console.log('Failed requests detected:', failedRequests);
  }

  await page.close();
});
