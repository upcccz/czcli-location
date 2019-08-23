#!/usr/bin/env node 

// 创建子命令，切割命令行参数并执行
const program = require('commander')
// 文件模块
const fs = require('fs')
// 路径模块
const path = require('path')
// loading
const ora = require('ora')
// 命令行字体颜色
const chalk = require('chalk')
// 交互式命令行,可在控制台提问
const inquirer = require('inquirer')

const shell = require('shelljs');

const logSymbols = require('log-symbols');

const down = require('./down-project.js');

program
  .version(require('../package').version)
  .usage('<command> [options]')
  .command('init', 'a new project')

program
  .command('init').action(name => {
    inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        default: 'my-pro',
        message: 'Project name'
      },
      {
        type: 'input',
        name: 'description',
        default: 'A Vue.js project',
        message: 'what\'s your project description'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author'
      }
    ]).then(async answer => {
      const spinner = ora('downloading template').start();
      await down(answer);
      spinner.succeed();
      console.log(logSymbols.success, chalk.green('download template successfully'));
      inquirer.prompt([
        {
          type:'confirm',
          name: 'isUseNpm',
          message: 'Whether to install dependencies using npm install'
        }
      ]).then(answers => {
        if (answers.isUseNpm) {
          shell.cd(process.cwd() + '/' + answer.name);
          const spinner1 = ora('Installing project dependencies ... \n').start();
          
          if (shell.exec('npm install').code !== 0) {//执行npm install 命令
            spinner1.fail();
            shell.echo('Error: install failed');
            shell.exit(1);
          } else {
            spinner1.succeed();
            console.log(logSymbols.success, chalk.green('installation completed'));
            console.log();
            console.log('To get started:');
            console.log();
            console.log(chalk.yellow(`   cd ${answer.name}`));
            console.log(chalk.yellow('   npm run dev'));
            console.log();
          }
        }
      })
    })
  })

program.parse(process.argv);