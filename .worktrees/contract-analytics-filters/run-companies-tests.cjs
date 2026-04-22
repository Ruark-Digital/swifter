#!/usr/bin/env node

/**
 * Companies Route Test Runner
 * Executes all Playwright tests for the companies functionality
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

function logSection(message) {
  log('\n' + '-'.repeat(40), 'blue');
  log(message, 'yellow');
  log('-'.repeat(40), 'blue');
}

function runCommand(command, description) {
  try {
    log(`\n🚀 ${description}...`, 'cyan');
    log(`Command: ${command}`, 'magenta');
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    log('✅ Success!', 'green');
    if (output.trim()) {
      log('Output:', 'blue');
      console.log(output);
    }
    return true;
  } catch (error) {
    log('❌ Failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.stdout) {
      log('Output:', 'yellow');
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      log('Error Output:', 'red');
      console.log(error.stderr.toString());
    }
    return false;
  }
}

function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  // Check if Playwright is installed
  if (!fs.existsSync('node_modules/@playwright/test')) {
    log('❌ Playwright is not installed!', 'red');
    log('Please run: npm install --save-dev @playwright/test', 'yellow');
    return false;
  }
  
  // Check if test files exist
  const testFiles = [
    'tests/companies.spec.ts',
    'tests/companies-detailed.spec.ts',
    'tests/companies-api.spec.ts',
    'tests/companies-performance.spec.ts',
    'tests/utils/test-helpers.ts'
  ];
  
  const missingFiles = testFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log('❌ Missing test files:', 'red');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));
    return false;
  }
  
  // Check if playwright.config.ts exists
  if (!fs.existsSync('playwright.config.ts')) {
    log('❌ playwright.config.ts not found!', 'red');
    return false;
  }
  
  log('✅ All prerequisites met!', 'green');
  return true;
}

function generateTestReport() {
  const reportPath = 'playwright-report';
  if (fs.existsSync(reportPath)) {
    log(`\n📊 Test report generated at: ${path.resolve(reportPath)}`, 'cyan');
    log('Open the report with: npx playwright show-report', 'yellow');
  }
}

function main() {
  logHeader('Companies Route - Playwright Test Suite');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  const browser = args[1] || 'chromium';
  const headless = !args.includes('--headed');
  const debug = args.includes('--debug');
  const ui = args.includes('--ui');
  
  log(`\n🎯 Test Configuration:`, 'bright');
  log(`  Test Type: ${testType}`, 'cyan');
  log(`  Browser: ${browser}`, 'cyan');
  log(`  Headless: ${headless}`, 'cyan');
  log(`  Debug: ${debug}`, 'cyan');
  log(`  UI Mode: ${ui}`, 'cyan');
  
  let testPattern = '';
  let description = '';
  
  switch (testType) {
    case 'basic':
      testPattern = 'tests/companies.spec.ts';
      description = 'Running basic companies tests';
      break;
    case 'detailed':
      testPattern = 'tests/companies-detailed.spec.ts';
      description = 'Running detailed companies tests';
      break;
    case 'api':
      testPattern = 'tests/companies-api.spec.ts';
      description = 'Running API integration tests';
      break;
    case 'performance':
      testPattern = 'tests/companies-performance.spec.ts';
      description = 'Running performance and accessibility tests';
      break;
    case 'all':
    default:
      testPattern = 'tests/companies*.spec.ts';
      description = 'Running all companies tests';
      break;
  }
  
  // Build command
  let command = `npx playwright test ${testPattern}`;
  
  if (browser !== 'all') {
    command += ` --project=${browser}`;
  }
  
  if (!headless) {
    command += ' --headed';
  }
  
  if (debug) {
    command += ' --debug';
  }
  
  if (ui) {
    command = `npx playwright test --ui ${testPattern}`;
  }
  
  // Add reporter
  command += ' --reporter=html,line';
  
  logSection(description);
  
  const success = runCommand(command, description);
  
  if (success) {
    log('\n🎉 All tests completed successfully!', 'green');
    generateTestReport();
  } else {
    log('\n💥 Some tests failed!', 'red');
    generateTestReport();
    process.exit(1);
  }
  
  // Additional commands
  logSection('Additional Options');
  log('Available commands:', 'bright');
  log('  node run-companies-tests.js basic          # Run basic tests only', 'cyan');
  log('  node run-companies-tests.js detailed       # Run detailed tests only', 'cyan');
  log('  node run-companies-tests.js api            # Run API tests only', 'cyan');
  log('  node run-companies-tests.js performance    # Run performance tests only', 'cyan');
  log('  node run-companies-tests.js all            # Run all tests (default)', 'cyan');
  log('  node run-companies-tests.js all firefox    # Run on Firefox', 'cyan');
  log('  node run-companies-tests.js all webkit     # Run on WebKit', 'cyan');
  log('  node run-companies-tests.js all all        # Run on all browsers', 'cyan');
  log('  node run-companies-tests.js all chromium --headed  # Run with browser visible', 'cyan');
  log('  node run-companies-tests.js all chromium --debug   # Run in debug mode', 'cyan');
  log('  node run-companies-tests.js all chromium --ui      # Run in UI mode', 'cyan');
  
  log('\nOther useful commands:', 'bright');
  log('  npx playwright show-report                 # View test report', 'yellow');
  log('  npx playwright codegen localhost:3000     # Generate new tests', 'yellow');
  log('  npx playwright install                     # Install browsers', 'yellow');
}

if (require.main === module) {
  main();
}

module.exports = { runCommand, checkPrerequisites };