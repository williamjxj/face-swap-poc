#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const FaceFusionAPITester = require('./face-fusion-api-test');

// Parse command line arguments
program
  .name('face-fusion-cli')
  .description('CLI tool for testing Face Fusion API')
  .version('1.0.0');

program
  .command('test')
  .description('Run tests for Face Fusion API')
  .requiredOption('-s, --source <path>', 'Path to source image file')
  .requiredOption('-t, --target <path>', 'Path to target video file')
  .option('-o, --output <path>', 'Path to save the result file', './output.mp4')
  .action(async (options) => {
    console.log('Face Fusion API Test Tool');
    console.log('------------------------');
    
    const tester = new FaceFusionAPITester();
    await tester.runE2ETest(options.source, options.target, options.output);
  });

program
  .command('create')
  .description('Create a face fusion task')
  .requiredOption('-s, --source <path>', 'Path to source image file')
  .requiredOption('-t, --target <path>', 'Path to target video file')
  .action(async (options) => {
    console.log('Creating Face Fusion Task');
    console.log('-----------------------');
    
    const tester = new FaceFusionAPITester();
    try {
      const outputPath = await tester.testCreateTask(options.source, options.target);
      console.log(`\nTask created with output path: ${outputPath}`);
      console.log(`\nTo check status and download result, run:`);
      console.log(`face-fusion-cli query -p "${outputPath}" -o "result.mp4"`);
    } catch (error) {
      console.error('Failed to create task:', error.message);
      process.exit(1);
    }
  });

program
  .command('query')
  .description('Query task result and download file')
  .requiredOption('-p, --path <output_path>', 'Output path from create task response')
  .option('-o, --output <path>', 'Path to save the result file', './output.mp4')
  .option('-r, --retries <number>', 'Maximum number of retry attempts', '10')
  .option('-d, --delay <milliseconds>', 'Delay between retries in ms', '5000')
  .action(async (options) => {
    console.log('Querying Face Fusion Task');
    console.log('-----------------------');
    
    const tester = new FaceFusionAPITester();
    try {
      const success = await tester.testQueryTaskResult(
        options.path, 
        options.output,
        parseInt(options.retries),
        parseInt(options.delay)
      );
      
      if (success) {
        console.log(`\nTask completed successfully and result saved to: ${options.output}`);
      } else {
        console.error('\nFailed to download task result');
        process.exit(1);
      }
    } catch (error) {
      console.error('Failed to query task:', error.message);
      process.exit(1);
    }
  });

if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse(process.argv);
}