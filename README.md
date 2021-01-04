# electrom

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/electrom.svg?style=flat-square
[npm-url]: https://npmjs.org/package/electrom
[travis-image]: https://api.travis-ci.com/xudafeng/electrom.svg?branch=master
[travis-url]: https://travis-ci.com/github/xudafeng/electrom
[coveralls-image]: https://img.shields.io/coveralls/xudafeng/electrom.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/xudafeng/electrom?branch=master
[node-image]: https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/electrom.svg?style=flat-square
[download-url]: https://npmjs.org/package/electrom

> Electrom is a resource management solution for Electron applications, which is convenient for performance management and friendly debugging of multiple windows.

![](./demo.png)

## Installment

```bash
$ npm i electrom --save-dev
```

## Usage

```bash
$ npx electrom 100
```

## APIs

```javascript
const electrom = require('electrom');

electrom(100)
  .then(data => {
    console.log(data);
  })
  .catch(e) {
    console.log(e);
  }
```

## TODO

- [ ] usage summary

## License

The MIT License (MIT)
