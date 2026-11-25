/* fb-node.js - runs the real browser engine (assets/fb-live.js) under node and prints its canon. */
var FB = require("../assets/fb-live.js");
process.stdout.write(JSON.stringify(FB.canon()));
