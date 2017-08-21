var crypto = require('crypto')
var sign = function(val, secret) {
    return val + '.' + crypto.createHmac('sha256', secret).update(val).digest('base64').replace(/\=+$/, '')
}


console.log(sign('abc', 'secret'))


var unsign = function(val, secret) {
    var str = val.slice(0, val.lastIndexOf('.'))
    return sign(str, secret) == val ? str : false
}


console.log(unsign('abc.mUba1OAOkT/Ivo5dP34RCkqegy+D+wnDRShdeGONig4', 'secret'))
