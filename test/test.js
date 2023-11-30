/**
 * versionn
 *
 * @copyright (C) 2014- commenthol
 * @license MIT
 */

'use strict'

/* global describe, it, before, beforeEach */

var assert = require('assert')
var path = require('path')
var async = require('asyncc')
var sh = require('shelljs')

var Version = require('../lib/index')

var fixtures = path.join(__dirname, 'fixtures')

describe('#Version', function () {
  var packageJson = path.join(fixtures, 'package.json')

  it('construct', function () {
    var v = new Version(packageJson)
    assert.ok(v instanceof Version)
  })

  it('construct without new', function () {
    var v = Version(packageJson)
    assert.ok(v instanceof Version)
  })

  it('setVersion', function () {
    var v = new Version(packageJson)
    v.setVersion('0.0.0')
    assert.strictEqual(v.version, '0.0.0')
  })

  it('setVersion with bad semver', function () {
    var v = new Version(packageJson)
    v.setVersion('0a0.0')
    assert.strictEqual(v.version, undefined)
  })

  it('inc', function (done) {
    var v = new Version(packageJson)
    v.extract(function (err) {
      assert.ok(!err, '' + err)
      v.inc('patch')
      assert.strictEqual(v.version, '0.3.7')
      done()
    })
  })

  it('inc with bad semver command', function (done) {
    var v = new Version(packageJson)
    v.extract(function (err) {
      assert.ok(!err, '' + err)
      v.inc('patchit')
      assert.strictEqual(v.version, '0.3.6')
      done()
    })
  })

  it('changefiles with undefined version', function (done) {
    // var v = new Version(fixture('notthere.json'))
    Version.changeFiles([], undefined, function (err) {
      assert.strictEqual(err.message, 'version is undefined')
      done()
    })
  })
})

describe('readFile', function () {
  it('extract with error ', function (done) {
    var v = new Version(path.join(fixtures, 'notthere.json'))
    v.extract(function (err) {
      assert.strictEqual(err.code, 'ENOENT')
      done()
    })
  })

  it('extract from bad json file ', function (done) {
    var v = new Version(path.join(fixtures, 'packagebad.json'))
    v.extract(function (err) {
      assert.ok(err.message.indexOf('Unexpected string in JSON at') === 0, err.message)
      done()
    })
  })

  it('package.json', function (done) {
    var v = new Version(path.join(fixtures, 'package.json'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '0.3.6')
      done()
    })
  })

  it('VERSION', function (done) {
    var v = new Version(path.join(fixtures, 'VERSION'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '1.0.3-12')
      done()
    })
  })

  it('file.js', function (done) {
    var v = new Version(path.join(fixtures, 'file.js'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '5.0.23')
      done()
    })
  })
})

describe('change files', function () {
  before(function (done) {
    sh.cp('-f', path.join(__dirname, 'fixtures/*'), path.join(__dirname, 'tmp/'))
    done()
  })

  it('change with error', function () {
    var v = new Version(path.join(__dirname, 'fixtures/notthere.json'))
    v.setVersion('0.0.1')
    v.change(function (err) {
      assert.strictEqual(err.code, 'ENOENT')
    })
  })

  it('package.json', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/package.json'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '0.3.6')
      if (v.inc('patch')) {
        v.change(function (err) {
          assert.ok(!err, '' + err)
          assert.strictEqual(err, null)
          v.extract(function (err, version) {
            assert.ok(!err, '' + err)
            assert.strictEqual(version, '0.3.7')
            done()
          })
        })
      } else {
        assert.ok(false, 'could not increment')
      }
    })
  })

  it('VERSION', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/VERSION'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '1.0.3-12')
      if (v.inc('minor')) {
        v.change(function (err) {
          assert.ok(!err, '' + err)
          assert.strictEqual(err, null)
          v.extract(function (err, version) {
            assert.ok(!err, '' + err)
            assert.strictEqual(version, '1.1.0')
            done()
          })
        })
      } else {
        assert.ok(false, 'could not increment')
      }
    })
  })

  it('file.js', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/file.js'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '5.0.23')
      if (v.inc('preminor')) {
        v.change(function (err) {
          assert.strictEqual(err, null)
          v.extract(function (err, version) {
            assert.strictEqual(err, undefined)
            assert.strictEqual(version, '5.1.0-0')
            done()
          })
        })
      } else {
        assert.ok(false, 'could not increment')
      }
    })
  })
})

describe('change files with modifier', function () {
  before(function (done) {
    sh.cp('-f', path.join(__dirname, 'fixtures/*'), path.join(__dirname, 'tmp/'))
    done()
  })

  it('change package.json using --same', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/package.json'))
    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '0.3.6')
      if (v.inc('same')) {
        v.change(function (err) {
          assert.ok(!err, '' + err)
          assert.strictEqual(err, null)
          v.extract(function (err, version) {
            assert.ok(!err, '' + err)
            assert.strictEqual(version, '0.3.6')
            done()
          })
        })
      } else {
        assert.ok(false, 'could not increment')
      }
    })
  })
})

describe('change multiple files', function () {
  beforeEach(function (done) {
    sh.cp('-f', path.join(__dirname, 'fixtures/*'), path.join(__dirname, 'tmp/'))
    done()
  })

  it('from VERSION', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/VERSION'))
    var files = [ 'VERSION', 'package.json', 'file.js' ]

    files = files.map(function (file) {
      return path.join(__dirname, 'tmp', file)
    })

    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '1.0.3-12')
      if (v.inc('minor')) {
        Version.changeFiles(files, v.version, function (err) {
          assert.strictEqual(err.length, 0)
          async.eachLimit(5, files,
            function (file, _cb) {
              var vv = new Version(file)
              vv.extract(function (err, version) {
                assert.ok(!err, '' + err)
                assert.strictEqual(version, v.version)
                _cb()
              })
            }, function (_err) {
              done()
            })
        })
      } else {
        assert.ok(false, 'could not increment')
      }
    })
  })

  it('from VERSION changes notthere.json', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/VERSION'))
    var files = [ 'VERSION', 'notthere.json', 'package.json', 'file.js' ]

    files = files.map(function (file) {
      return path.join(__dirname, 'tmp', file)
    })

    v.extract(function (err, version) {
      assert.ok(!err, '' + err)
      assert.strictEqual(version, '1.0.3-12')
      if (v.inc('minor')) {
        Version.changeFiles(files, v.version, function (err) {
          assert.strictEqual(err.length, 1)
          async.eachLimit(5, files,
            function (file, _cb) {
              var vv = new Version(file)
              vv.extract(function (err, version) { // eslint-disable-line handle-callback-err
                if (~file.indexOf('notthere.json')) {
                  assert.strictEqual(version, undefined)
                } else {
                  assert.strictEqual(version, v.version)
                }
                _cb()
              })
            }, function (_err) {
              done()
            })
        })
      } else {
        assert.ok(false, 'could not increment')
      }
    })
  })

  it('from notthere.json', function (done) {
    var v = new Version(path.join(__dirname, 'tmp/notthere.json'))

    v.extract(function (err, version) { // eslint-disable-line handle-callback-err
      assert.strictEqual(version, undefined)
      try {
        v.inc('same')
      } catch (e) {
        assert.ok(e.message, 'could not increment')
      }
      done()
    })
  })

  it('shall throw if not a valid version', function (done) {
    const gitFn = new Version._.GitFn('& touch newFile', { dir: './' })
    try {
      gitFn.tag(done)
    } catch (e) {
      assert.strictEqual(e.message, 'version is invalid')
      done()
    }
  })
})
