var User = require('./user')
  , Nonce = require('./nonce');

// Simple in-memory database for the sake of example

function Crudify(Schema) {
  this.db = {};
  this.Schema = Schema;
}

Crudify.prototype.get = function(id) {
  return this.db[id];
}

Crudify.prototype.find = function(check) {
  for(id in this.db) {
    var m = this.db[id];
    if(check(m)) return m;
  }
}

Crudify.prototype.create = function() {
  var self = this;
  var _arguments = arguments;
  function S() {
    return self.Schema.apply(this, _arguments);
  }
  S.prototype = this.Schema.prototype;
  var model = new S();
  this.db[model.id] = model;
  return model;
}

Crudify.prototype.delete = function(id) {
  delete this.db[id];
}

module.exports = {
  users: new Crudify(User),
  nonces: new Crudify(Nonce)
};