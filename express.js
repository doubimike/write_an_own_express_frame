
module.exports = function(req,res) {
	return function (req,res) {
		res.writeHead(200,{'Content-type':'text/plain'})
		res.end('Hello World\n')
	}
}
