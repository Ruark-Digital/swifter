#!/usr/bin/env node

/**
 * Companies Page Test Runner
 * Executes all Playwright tests for the Companies page functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test categories and their corresponding files
const TEST_CATEGORIES = {
  basic: ['companies.spec.ts'],
  detailed: ['companies-detailed.spec.ts'],
  api: ['companies-api.spec.ts'],
  performance: ['companies-performance.spec.ts'],
  all: ['companies.spec.ts', 'companies-detailed.spec.ts', 'companies-api.spec.ts', 'companies-performance.spec.ts']
};

// Configuration options
const CONFIG = {
  testDir: path.join(__dirname),
  browsers: ['chromium', 'firefox', 'webkit'],
  defaultBrowser: 'chromium',
  defaultMode: 'headless'
};

function checkPrerequisites() {
  logHeader('Checking Prerequisites');
  
  try {
    // Check if Playwright is installed
    execSync('npx playwright --version', { stdio: 'pipe' });
    logSuccess('Playwright is installed');
  } catch (error) {
    logError('Playwright is not installed. Run: npm install @playwright/test');
    process.exit(1);
  }
  
  // Check if test files exist
  const testFiles = TEST_CATEGORIES.all;
  const missingFiles = [];
  
  testFiles.forEach(file => {
    const filePath = path.join(CONFIG.testDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    logError(`Missing test files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  logSuccess('All test files are present');
}

function parseArguments() {
  const args = process.argv.slice(2);
  const config = {
    category: 'basic',
    browser: CONFIG.defaultBrowser,
    mode: CONFIG.defaultMode,
    debug: false,
    ui: false,
    headed: false,
    reporter: 'html'
  };
  
  // Parse arguments
  args.forEach((arg, index) => {
    switch (arg) {
      case 'basic':
      case 'detailed':
      case 'api':
      case 'performance':
      case 'all':
        config.category = arg;
        break;
      case '--browser':
      case '-b':
        if (args[index + 1] && CONFIG.browsers.includes(args[index + 1])) {
          config.browser = args[index + 1];
        }
        break;
      case '--headed':
        config.headed = true;
        config.mode = 'headed';
        break;
      case '--debug':
        config.debug = true;
        break;
      case '--ui':
        config.ui = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  });
  
  return config;
}

function showHelp() {
  logHeader('Companies Page Test Runner - Help');
  log('\nUsage: node run-tests.cjs [category] [options]\n');
  
  log('Categories:', 'bright');
  log('  basic       - Run basic UI tests');
  log('  detailed    - Run detailed functionality tests');
  log('  api         - Run API integration tests');
  log('  performance - Run performance and accessibility tests');
  log('  all         - Run all test categories (default: basic)\n');
  
  log('Options:', 'bright');
  log('  --browser, -b [browser]  - Browser to use (chromium, firefox, webkit)');
  log('  --headed                 - Run tests in headed mode');
  log('  --debug                  - Run tests in debug mode');
  log('  --ui                     - Run tests in UI mode');
  log('  --help, -h               - Show this help message\n');
  
  log('Examples:', 'bright');
  log('  node run-tests.cjs basic');
  log('  node run-tests.cjs all --browser firefox');
  log('  node run-tests.cjs performance --headed');
  log('  node run-tests.cjs api --debug\n');
}

function buildPlaywrightCommand(config) {
  const testFiles = TEST_CATEGORIES[config.category];
  const filePatterns = testFiles.map(file => path.join(CONFIG.testDir, file)).join(' ');
  
  let command = `npx playwright test ${filePatterns}`;
  
  // Add browser selection
  command += ` --project=${config.browser}`;
  
  // Add mode options
  if (config.headed) {
    command += ' --headed';
  }
  
  if (config.debug) {
    command += ' --debug';
  }
  
  if (config.ui) {
    command += ' --ui';
  }
  
  // Add reporter
  command += ` --reporter=${config.reporter}`;
  
  return command;
}

function runTests(config) {
  logHeader(`Running Companies Page Tests - ${config.category.toUpperCase()}`);
  
  logInfo(`Test Category: ${config.category}`);
  logInfo(`Browser: ${config.browser}`);
  logInfo(`Mode: ${config.mode}`);
  
  if (config.debug) {
    logInfo('Debug mode enabled');
  }
  
  if (config.ui) {
    logInfo('UI mode enabled');
  }
  
  const command = buildPlaywrightCommand(config);
  logInfo(`Command: ${command}`);
  
  try {
    log('\nExecuting tests...\n', 'yellow');
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '../../../..') });
    logSuccess('Tests completed successfully!');
  } catch (error) {
    logError('Tests failed!');
    logError(`Exit code: ${error.status}`);
    process.exit(error.status || 1);
  }
}

function generateReport() {
  logHeader('Generating Test Report');
  
  try {
    execSync('npx playwright show-report', { stdio: 'inherit', cwd: path.join(__dirname, '../../../..') });
  } catch (error) {
    logWarning('Could not open test report automatically');
    logInfo('You can view the report by running: npx playwright show-report');
  }
}

function main() {
  try {
    checkPrerequisites();
    const config = parseArguments();
    runTests(config);
    
    // Ask if user wants to see the report
    if (!config.debug && !config.ui) {
      log('\nWould you like to view the test report? (y/N)', 'cyan');
      // For automated runs, skip report generation
      // In interactive mode, you could add readline here
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  TEST_CATEGORIES,
  CONFIG
};