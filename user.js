
var userCount = 0;
/**
 *  Constructor
 *  Parameters:
 *    address = bitcoin address associated to the user
 *    name = user's name
 */
function User(address) {
  this.address = address;
  // Initializes the uid
  this.uid = ++userCount;
  // Sets some additional attributes
  this.created = Date.now();
  this.signinCount = 0;
}

User.prototype.__defineGetter__('id', function() {
  return this.uid;
});

module.exports = User;
