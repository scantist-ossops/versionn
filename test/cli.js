/**
 * versionn
 *
 * @copyright (C) 2016- commenthol
 * @license MIT
 */

'use strict'

/* global describe, it*/

var assert = require('assert')
var cli = require('../lib/cli')

describe('#versionn cli', function () {
  it('no args', function () {
    var opts = cli([], [])
    assert.deepEqual(opts, {files: []})
  })
  it('--help', function () {
    var opts = cli(['--help'], [])
    assert.deepEqual(opts, {help: true, files: []})
  })
  it('-h', function () {
    var opts = cli(['-h'], [])
    assert.deepEqual(opts, {help: true, files: []})
  })
  it('--info', function () {
    var opts = cli(['--info'], [])
    assert.deepEqual(opts, {info: true, files: []})
  })
  it('-i', function () {
    var opts = cli(['-i'], [])
    assert.deepEqual(opts, {info: true, files: []})
  })
  it('--info --help', function () {
    var opts = cli(['--info', '--help'], [])
    assert.deepEqual(opts, {help: true, info: true, files: []})
  })
  it('--dir with missing param', function () {
    var opts = cli(['--dir'], [])
    assert.deepEqual(opts, {dir: undefined, files: []})
  })
  it('-d with param', function () {
    var opts = cli(['-d', '/tmp/dir'], [])
    assert.deepEqual(opts, {dir: '/tmp/dir', files: []})
  })
  it('--extract without param', function () {
    var opts = cli(['--extract'], [])
    assert.deepEqual(opts, {extract: true, files: []})
  })
  it('--extract with param', function () {
    var opts = cli(['--extract', './VERSION'], [])
    assert.deepEqual(opts, {extract: './VERSION', files: []})
  })
  it('--tag', function () {
    var opts = cli(['--tag'], [])
    assert.deepEqual(opts, {tag: true, files: []})
  })
  it('--untag', function () {
    var opts = cli(['--untag'], [])
    assert.deepEqual(opts, {untag: true, files: []})
  })
  it('--commit', function () {
    var opts = cli(['--commit'], [])
    assert.deepEqual(opts, {commit: true, files: []})
  })
  it('--version', function () {
    var opts = cli(['--version'], [])
    assert.deepEqual(opts, {cliVersion: true, files: []})
  })
  it('-V', function () {
    var opts = cli(['-V'], [])
    assert.deepEqual(opts, {cliVersion: true, files: []})
  })
})

describe('commands', function () {
  var CMDS = require('..').CMDS

  it('premajor', function () {
    var args = ['--premajor', 'package.json']
    var opts = cli(args.slice(), CMDS)
    assert.deepEqual(opts, {cmd: 'premajor', files: [args[1]]})
  })
  it('same', function () {
    var args = ['same', 'package.json', 'VERSION']
    var opts = cli(args.slice(), CMDS)
    assert.deepEqual(opts, {cmd: 'same', files: [args[1], args[2]]})
  })
  it('set', function () {
    var args = ['set', '1.0.0', 'package.json', 'VERSION']
    var opts = cli(args.slice(), CMDS)
    assert.deepEqual(opts, {cmd: 'set', version: '1.0.0', files: [args[2], args[3]]})
  })
})
