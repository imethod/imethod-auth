'use strict';
let loopback = require('loopback');
let app = require('../server/server');
let fs = require('fs');
let http = require('http');
let path = require('path');
let url = require('url');
let crypto = require('crypto');
let errorCodes = {};
var pub = {};
pub.loopback = loopback;
pub.app = app;
let _assign = (target) => {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};
pub.extend = Object.assign || _assign;
pub.isNotEmptyStr = (str) => {
  if (typeof str == 'string' && str.length > 0) return true;
};
pub.isNotObj = (obj) => {
  if (typeof obj == 'undefined' || obj == null) return true;
};
pub.getCurrentDateTimeStr = function () {
  var currentDate = new Date();
  var fmt = 'yyyy-MM-dd hh:mm:ss';
  var o = {
    'M+': currentDate.getMonth() + 1, //月份
    'd+': currentDate.getDate(), //日
    'h+': currentDate.getHours(), //小时
    'm+': currentDate.getMinutes(), //分
    's+': currentDate.getSeconds(), //秒
    'q+': Math.floor((currentDate.getMonth() + 3) / 3), //季度
    'S': currentDate.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (currentDate.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return fmt;
};
pub.getCurrentDateStr = function () {
  var currentDate = new Date();
  var fmt = 'yyyy-MM-dd';
  var o = {
    'M+': currentDate.getMonth() + 1, //月份
    'd+': currentDate.getDate(), //日
    'h+': currentDate.getHours(), //小时
    'm+': currentDate.getMinutes(), //分
    's+': currentDate.getSeconds(), //秒
    'q+': Math.floor((currentDate.getMonth() + 3) / 3), //季度
    'S': currentDate.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (currentDate.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return fmt;
};
pub.getCurrentDate = function () {
  return new Date();
};
pub.getUUid = function (len, radix) {
  let chars = '0123456789abcdefghkmnopqrstuvwxyzABCDEFGHKMNOPQRSTUVWXYZ'.split('');
  let uuid = [];
  let i;
  radix = radix || chars.length;
  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  } else {
    // rfc4122, version 4 form
    let r;
    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';
    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return uuid.join('');
};
pub.getModelByName = function (modelName) {
  return loopback.getModel(modelName);
};
pub.inArray = function (arr, el) {
  arr = arr || [];
  for (var i = 0, k = arr.length; i < k; i++) {
    if (el == arr[i]) {
      return true;
    }
  }
};
pub.inArrayMatch = function (arr, el) {
  arr = arr || [];
  for (var i = 0, k = arr.length; i < k; i++) {
    if (el.indexOf(arr[i]) > -1) {
      return true;
    }
  }
};
pub.getArg = function (arg) {
  return app.get(arg);
};
pub.saveUser = function (userInfo) {
  var context = loopback.getCurrentContext();
  if (context != null) {
    context.set('threadUserInfo', userInfo);
  }
};
pub.getUser = function () {
  var context = loopback.getCurrentContext();
  if (context != null) {
    return context.get('threadUserInfo');
  }
};
pub.buildMap = function (list, code, codeName) {
  var map = {};
  list = list || [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    map[item[code]] = item[codeName];
  }
  return map;
};
pub.buildTree = function (list, code, parentCode, rootVal, childName) {
  let root = list.find(function (x) {
    return x[code] == rootVal;
  });
  return buildChildTree(list, code, parentCode, rootVal, childName, root);
};
let buildChildTree = function (list, code, parentCode, rootVal, childName, root) {
  let find = [];
  for (var cl of list) {
    if (cl[parentCode] == root[code]) {
      find.push(cl);
    }
  }
  root[childName] = find;
  if (root[childName].length != 0) {
    for (let el of root[childName]) {
      buildChildTree(list, code, parentCode, rootVal, childName, el);
    }
  }
  return root;
};
pub.getDateExp = function (exp) {
  var timeStr = pub.getCurrentDateStr();
  var timeArr = timeStr.split('-');
  if (12 - timeArr[1] >= exp) {
    timeArr[1] = parseInt(timeArr[1]) + exp;
  } else {
    timeArr[1] = parseInt(timeArr[1]) + exp - 12;
    timeArr[0] = parseInt(timeArr[0]) + 1;
  }
  return new Date(timeArr.join('/'));
};
pub.ldapSSHA = function ($password) {
  var hash = crypto.createHash('sha1');
  var salt = crypto.randomBytes(20);
  hash.update($password);
  hash.update(salt);
  var digest = hash.digest();
  return '{SSHA}' + Buffer.concat([digest, salt], digest.length + salt.length).toString('base64');
};
pub.SSHACheck = function ($password, $ssha) {
  if ($ssha.startsWith('{SSHA}')) {
    $ssha = $ssha.substring(6, $ssha.length);
  }
  var $hash = new Buffer($ssha, 'base64');
  var $digest = $hash.slice(0, 20);
  var $salt = $hash.slice(20);
  var hash = crypto.createHash('sha1');
  hash.update($password);
  hash.update($salt);
  var digest = hash.digest();
  return digest.equals($digest);
};
pub.md5 = function (content) {
  var md5 = crypto.createHash('md5');
  md5.update(content);
  return md5.digest('hex');
};

pub.getError = function (errMsg, status) {
  var error = new Error(errMsg);
  error.status = status || 502;
  delete error.stack;
  return error;
};
pub.getEUID = function (len) {
  var chars = 'QWERTYUIOPLKJHGFDSAZXCVBNM123456789qazwsxedcrfvtgbyhnujmikolp'.split('');
  let uuid = [];
  let i;
  let radix = chars.length;
  for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  return uuid.join('');
};
pub.getErrorCodeMsg = function (errCode) {
  return errorCodes[errCode + ''] || '';
};

function createPromiseCallback() {
  var cb;
  if (!global.Promise) {
    cb = function () {
    };
    cb.promise = {};
    Object.defineProperty(cb.promise, 'then', {get: throwPromiseNotDefined});
    Object.defineProperty(cb.promise, 'catch', {get: throwPromiseNotDefined});
    return cb;
  }
  var promise = new global.Promise(function (resolve, reject) {
    cb = function (err, data) {
      if (err) return reject(err);
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}
function throwPromiseNotDefined() {
  throw new Error(
    'Your Node runtime does support ES6 Promises. ' +
    'Set "global.Promise" to your preferred implementation of promises.');
}
pub.createPromiseCallback = createPromiseCallback;
module.exports = pub;
