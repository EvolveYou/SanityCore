"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = trimQuery;
function trimQuery(query) {
  return query.trim().replace(/\s+/, ' ');
}