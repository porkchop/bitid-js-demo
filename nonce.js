var crypto = require('crypto')
  , EXPIRATION_DELAY = 600; // Expiration delay (in seconds)

function Nonce(sid) {
  this.sid = sid;
  this.uid = null;
  // Initializes a value for the nonce (let's call that the nonce id)
  this.nid = crypto.randomBytes(8).toString('hex');
  // Sets the creation date
  this.created = Date.now();
}

Nonce.prototype.expired = function() {
  return Date.now() - this.created > EXPIRATION_DELAY * 1000;
}

Nonce.prototype.__defineGetter__('id', function() {
  return this.nid;
});

module.exports = Nonce;
