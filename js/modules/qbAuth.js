/*
 * QuickBlox JavaScript SDK
 *
 * Authentication Module
 *
 */

var config = require('../qbConfig'),
    Utils = require('../qbUtils'),
    CryptoJS = require('crypto-js/hmac-sha1');

function AuthProxy(service) {
  this.service = service;
}

AuthProxy.prototype = {

  createSession: function(params, callback) {
    var _this = this, message;

    if (typeof params === 'function' && typeof callback === 'undefined') {
      callback = params;
      params = {};
    }

    // Signature of message with SHA-1 using secret key
    message = generateAuthMsg(params);
    message.signature = signMessage(message, config.creds.authSecret);
    
    if (config.debug) { console.log('AuthProxy.createSession', message); }
    this.service.ajax({url: Utils.getUrl(config.urls.session), type: 'POST', data: message},
                      function(err, res) {
                        if (err) {
                          callback(err, null);
                        } else {
                          _this.service.setSession(res.session);
                          callback(null, res.session);
                        }
                      });
  },

  destroySession: function(callback) {
    var _this = this;
    if (config.debug) { console.log('AuthProxy.destroySession'); }
    this.service.ajax({url: Utils.getUrl(config.urls.session), type: 'DELETE', dataType: 'text'},
                      function(err, res) {
                        if (err) {
                          callback(err, null);
                        } else {
                          _this.service.setSession(null);
                          callback(null, res);
                        }
                      });
  },

  login: function(params, callback) {
    if (config.debug) { console.log('AuthProxy.login', params); }
    this.service.ajax({url: Utils.getUrl(config.urls.login), type: 'POST', data: params},
                      function(err, res) {
                        if (err) { callback(err, null); }
                        else { callback(null, res.user); }
                      });
  },

  logout: function(callback) {
    if (config.debug) { console.log('AuthProxy.logout'); }
    this.service.ajax({url: Utils.getUrl(config.urls.login), type: 'DELETE', dataType:'text'}, callback);
  }
  
};

module.exports = AuthProxy;

/* Private
---------------------------------------------------------------------- */
function generateAuthMsg(params) {
  var message = {
    application_id: config.creds.appId,
    auth_key: config.creds.authKey,
    nonce: Utils.randomNonce(),
    timestamp: Utils.unixTime()
  };
  
  // With user authorization
  if (params.login && params.password) {
    message.user = {login: params.login, password: params.password};
  } else if (params.email && params.password) {
    message.user = {email: params.email, password: params.password};
  } else if (params.provider) {
    // Via social networking provider (e.g. facebook, twitter etc.)
    message.provider = params.provider;
    if (params.scope) {
      message.scope = params.scope;
    }
    if (params.keys && params.keys.token) {
      message.keys = {token: params.keys.token};
    }
    if (params.keys && params.keys.secret) {
      messages.keys.secret = params.keys.secret;
    }
  }
  
  return message;
}

function signMessage(message, secret) {
  var sessionMsg = Object.keys(message).map(function(val) {
    if (typeof message[val] === 'object') {
      return Object.keys(message[val]).map(function(val1) {
        return val + '[' + val1 + ']=' + message[val][val1];
      }).sort().join('&');
    } else {
      return val + '=' + message[val];
    }
  }).sort().join('&');
  
  return CryptoJS(sessionMsg, secret).toString();
}
