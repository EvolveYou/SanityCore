"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generateGuid;
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}
function generateGuid() {
  return [s4(), s4(), '-', s4(), '-', s4(), '-', s4(), '-', s4(), s4(), s4()].join('');
}