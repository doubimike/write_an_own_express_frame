var url = require('url')
var fs = require('fs')
var path = require('path')

var handles = {
    p: {
        a: function(req, res) {
            res.writeHead(200, { 'Content-type': 'text/plain' })
            res.end('a controller' + arguments[2])
        }
    },
    cookie: {
        test: function(req, res) {
            console.log('req.session', req.session)
            if (!req.session.isVisit) {

                // res.setHeader('Set-Cookie', serialize('isVisit', '1'))
                req.session.isVisit = true
                res.writeHead(200)
                res.end('第一次')
            } else {
                res.writeHead(200)
                res.end('再次')
            }
        }
    },
    static: {
        file: function(req, res) {
            fs.stat(filename, function(err, stat) {
                var lastModified = stat.mtime.toUTCString()
                if (lastModified == req.headers['if-modified-since']) { res.writeHead(304, 'Not Modified') } else {
                    fs.readFile(filename, function(err, file) {
                        var lastModified = stat.mtime.toUTCString()
                        res.setHeader('Last-Modified', lastModified)
                        res.writeHead(200, 'OK')
                        res.end(file)
                    })
                }

            })
        }
    }
}

var parseCookie = function(cookie) {
    var cookies = {}
    if (!cookie) {
        return cookies
    }

    var list = cookie.split(';')
    for (var i = 0; i < list.length; i++) {
        var pair = list[i].split('=')
        cookies[pair[0].trim()] = pair[1]
    }
    return cookies
}

var serialize = function(name, val, opt) {
    var pairs = [name + '=' + (val)]
    opt = opt || {}
    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge)
    if (opt.domain) pairs.push('Domain=' + opt.domain)
    if (opt.path) pairs.push('Path=' + opt.path)
    if (opt.expires) pairs.push('Expires=' + opt.expires)
    if (opt.httpOnly) pairs.push('HttpOnly')
    if (opt.secure) pairs.push('Secure')
    console.log('serialize', pairs.join(';'))
    return pairs.join(';')
}

var sessions = {}

var key = 'session_id'

var EXPIRES = 20 * 60 * 1000

var generate = function() {
    var session = {}
    session.id = (new Date()).getTime() + Math.random()
    session.cookie = {
        expire: (new Date()).getTime() + EXPIRES
    }
    sessions[session.id] = session
    console.log('generate seeesion', session)
    return session
}

var getURL = function(_url, key, value) {
    var obj = url.parse(_url, true)
    obj.query[key] = value
    return url.format(obj)

}

var crypto = require('crypto')
var sign = function(val, secret) {
    return val + '.' + crypto.createHmac('sha256', secret).update(val).digest('base64').replace(/\=+$/, '')
}


console.log(sign('abc', 'secret'))


var unsign = function(val, secret) {
    var str = val.slice(0, val.lastIndexOf('.'))
    return sign(str, secret) == val ? str : false
}



module.exports = function(req, res) {
    return function(req, res) {

        var writeHead = res.writeHead
        res.writeHead = function() {
            var cookies = res.getHeader('Set-Cookie')
            var session = serialize(key, sign(req.session.id.toString(), 'mike'))
            console.log('-----session', session)
            console.log('-----cookies', cookies)
            if (cookies) {
                cookies = Array.isArray(cookies) ? cookies.concat(session) : [cookies, session]
            } else {
                cookies = [session]
            }

            console.log('set cookies', cookies)
            res.setHeader('Set-Cookie', cookies)
            return writeHead.apply(this, arguments)
        }

        // console.log(req.headers)
        req.cookies = parseCookie(req.headers.cookie)
        console.log('req.cookies', req.cookies)
        var id = req.cookies[key]
        console.log('id', id)
        console.log('sessions', sessions)
        if (!id) {
            req.session = generate()
        } else {
            var session = sessions[id]
            console.log('-session', session)
            if (session) {
                console.log('has session')
                if (session.cookie.expires > (new Date().getTime())) {
                    session.cookie.expire = (new Date().getTime()) + EXPIRES
                    req.session = session
                } else {
                    delete sessions[id]
                    req.session = generate()
                }
            } else {
                req.session = generate()
            }
            // req.session = session
        }


        var pathname = url.parse(req.url).pathname

        // console.log('req.url', req.url)
        // console.log('pathname', pathname)
        var paths = pathname.split('/')
        var controller = paths[1] || 'index'
        var action = paths[2] || 'index'
        var args = paths.slice(3)

        // console.log('paths', paths)
        // console.log('controller', controller)
        // console.log('action', action)
        // console.log('args', args)

        var query = url.parse(req.url, true).query
            // console.log('query', query)
        req.query = query
            // console.log('req', req)



        if (handles[controller] && handles[controller][action]) {
            handles[controller][action].apply(null, [req, res].concat(args))
                // console.log('req.sessoion', req.session)
        } else {
            // res.writeHead(200)
            // res.end('找不到响应控制器')

            if (!req.session.isVisit) {
                console.log('第一次')
                    // res.setHeader('Set-Cookie', serialize('isVisit', '1'))
                req.session.isVisit = true
                res.writeHead(200)
                res.end('第一次')
            } else {
                console.log('再次')
                res.writeHead(200)
                res.end('再次')
            }

        }

        // fs.readFile(path.join(__dirname, pathname), function(err, file) {
        //     if (err) {
        //         res.writeHead(404)
        //         res.end('找不到相关文件')
        //         return
        //     }
        //     res.writeHead(200, { 'Content-type': 'text/plain' })
        //     res.end(file)
        // })







        // switch (req.method) {
        //     case 'POST':
        //         res.writeHead(200, { 'Content-type': 'text/plain' })
        //         res.end('Hello World Post\n')
        //         break;
        //     case 'GET':
        //         res.writeHead(200, { 'Content-type': 'text/plain' })
        //         res.end('Hello World Get\n')
        //         break;
        // }



    }
}
