'use strict';

const path = require('path');
const electron = require('electron');
const {Application} = require('spectron');
const assert = require('assert');

describe('app-main2panel', function () {
  this.timeout(0);
  let app = null;

  before(function () {
    app = new Application({
      path: electron,
      args: [path.join(__dirname, 'fixtures', 'app-main2panel')]
    });
    return app.start();
  });

  after(function () {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('should be ok', function () {
    return app.client
      .waitUntilTextExists('.label', 'Ready')
      .getRenderProcessLogs()
      .then(function (logs) {
        assert.equal(logs.length, 6);
        assert.ok(logs[0].message.indexOf('[app:say] undefined') !== -1);
        assert.ok(logs[1].message.indexOf('[app:say] hello') !== -1);
        assert.ok(logs[2].message.indexOf('[say] undefined') !== -1);
        assert.ok(logs[3].message.indexOf('[say] hello') !== -1);
        assert.ok(logs[4].message.indexOf('[say] undefined') !== -1);
        assert.ok(logs[5].message.indexOf('[say] hello') !== -1);
      });
  });
});

describe('app-panel2panel', function () {
  this.timeout(0);
  let app = null;

  before(function () {
    app = new Application({
      path: electron,
      args: [path.join(__dirname, 'fixtures', 'app-panel2panel')]
    });
    return app.start();
  });

  after(function () {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('should be ok', function () {
    return app.client
      .windowByIndex(0)
      .waitUntilTextExists('.label', 'Ready')
      .getRenderProcessLogs()
      .then(function (logs) {
        console.log(logs);
        assert.equal(logs.length, 2);
        assert.ok(logs[0].message.indexOf('[say] undefined') !== -1);
        assert.ok(logs[1].message.indexOf('[say] hello bar!') !== -1);
      });
  });
});
