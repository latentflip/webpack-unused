# webpack-unused

Check your frontend code for files/assets that are no longer used.

Uses the output of `webpack --json` to see which files are actually used in your bundle,
and lists files which haven't been required.

## Usage:

```bash
# install webpack-unused
npm install -g webpack-unused

# run webpack using your normal webpack config etc
# with the --json switch to output the stats.json, and pipe to webpack-unused
# unused files in the cwd will be listed
webpack --json | webpack-unused

# if your source code is in a directory, like src/ pass that as a flag:
webpack --json | webpack-unused -s src

# if your you want to ignore some files that are not used by webpack - like specs you can pass ignore flag (glob):
webpack --json | webpack-unused -s src -i **/*.spec.js

# or even multiple glob patterns:
webpack --json | webpack-unused -s src -i '**/*.spec.js, lib/*.js'
```

## Notes/Caveats:

* this doesn't check for any unused npm modules etc that you have installed (`node_modules` is ignored)
* webpack-unused will detect non-js files that are required via loaders etc, however any requires that happen outside of webpack's knowledge may be incorrectly reported as unused, for example:
    * css-preprocessor imports, for example `less`'s `@import` happens outside the webpack flow, so files which are only required via `@import` will report as unused, even if they are
* it looks like currently files that would appear in your output from using webpack's `NormalModuleReplacementPlugin` don't appear in webpack's `--json` output, and so will be incorrectly reported as unused, while the original may be incorrectly reported as used. [issue #1](https://github.com/latentflip/webpack-unused/issues/1)
* ideally, you'll have all your frontend code in a `src/` directory or similar so that you can use the `-s` flag, if not, any non-frontend code in cwd will be reported as unused

## Related

- [jspm-unused](https://github.com/oligot/jspm-unused) - Find unused files in a Jspm project

## Contributing, etc

This is just a first stab, and I'm publishing it because I constantly look for/rewrite code to achieve this. PRs/Suggestions for improvements very welcome.
