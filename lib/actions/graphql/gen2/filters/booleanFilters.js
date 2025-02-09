"use strict";

function createBooleanFilters() {
  return {
    name: 'BooleanFilter',
    kind: 'InputObject',
    isConstraintFilter: true,
    fields: [{
      fieldName: 'eq',
      type: 'Boolean',
      description: 'Checks if the value is equal to the given input.'
    }, {
      fieldName: 'neq',
      type: 'Boolean',
      description: 'Checks if the value is not equal to the given input.'
    }]
  };
}
module.exports = createBooleanFilters;