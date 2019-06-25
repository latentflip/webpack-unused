#!/usr/bin/env node

'use strict';


const Path = require('path');
const Promisify = require('es6-promisify');
const Glob2 = Promisify(require('glob'));
const Glob = require('glob');

// webpack root? ideally start from package.json location I think
const cwd = process.cwd();

const argv = require('yargs')
              .usage('Usage: webpack --stats | $0 [options]')
              .example('webpack --stats | $0 -s src', 'Check for unused files in the `src/` directory')
              .alias('s', 'src')
              .describe('s', 'Directory of source code')
              .default('s', '.')
              .help('h')
              .alias('h', 'help')
              .argv;

// specify which directory to look in for source files
const srcDir = Path.resolve(argv.src);

const isWebpackLocal = (path) => {
  return (path.indexOf('./') === 0 && path.indexOf('./~/') === -1);
};

const selectLocalModules = (webpack) => {
  let modules = webpack.modules;

  if (!modules && webpack.children && webpack.children.length) {
    modules = [];

    webpack.children.forEach((child) => {
      child.chunks.forEach((chunk) => {
        modules = modules.concat(chunk.modules);
      });
    });
  }

  return modules.filter((module) => isWebpackLocal(module.name))
                        .map((module) => Path.join(cwd, module.name));
};

const findAllLocalFiles = (cwd) => {
  return Glob2('!(node_modules)/**/*.*', { cwd: srcDir })
          .then((files) => files.map((f) => Path.join(srcDir, f)));
};

const parseStdin = () => {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
      const chunk = process.stdin.read();

      if (chunk === null && data === '') {
        console.error('The output of webpack --json must be piped to webpack-unused');
        process.exit(1);
      }

      if (chunk !== null) {
        data += chunk.toString();
      }
    });

    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        console.error('Warning: output does not parse as json');
        console.error('Attempting to trim to json');
        const from = data.indexOf('{');
        const to = data.lastIndexOf('}');

        try {
          if (from === -1 || to === -1) {
            throw new Error('NOT_JSON');
          }
          resolve(JSON.parse(data.slice(from, to + 1)));
        } catch (e) {
          console.error('Output does not appear to be json at all');
          process.exit(1);
        }
      }
    });
  });
};

Promise.all([
  parseStdin().then(selectLocalModules),
  findAllLocalFiles(cwd)
]).then((args) => {
  const webpackFiles = args[0];
  const localFiles = args[1];

  const unused = localFiles.filter((file) => webpackFiles.indexOf(file) === -1)
                           .map((file) => `./${Path.relative(cwd, file)}`);
  console.log(unused.join('\n'));
});
