var crypto = require('crypto')
var multer = require('multer')
const fs = require('fs');
const logger = require('./logger');

var key = new Buffer(config.aes256Key, 'hex');
var iv = new Buffer(config.aes256Iv, 'hex');

var cipher = crypto.createCipher('aes-256-cbc', key)
var decipher = crypto.createDecipher('aes-256-cbc', key)

var cryptoUtil = {
	filecipher: function(req, path) {
		var base64 = req.file.buffer.toString('base64')
		var enData = cipher.update(base64);
		var fileName = path + new Date().valueOf() +".enc";
		logger.debug('cryptoUtil > filecipher / base64 :: ' + base64 + '	enData :: ' + enData + '	fileName :: ' + fileName);
		fs.writeFileSync(fileName,enData);
	},

	filedecipher: function(file) {
		var data = fs.readFileSync('uploads/' + file);
		var binary = new Buffer(data,'base64')
		var decrypted = decipher.update(binary, 'binary', 'utf8')
		logger.debug('cryptoUtil > filedecipher / data :: ' + data + '	binary :: ' + binary + '	decrypted :: ' + decrypted);
		return decrypted;
	},

	// sha256
	sha256Crypto: function(cryptoVal) {
		logger.debug('cryptoUtil > sha256Crypto / cryptoVal :: ' + cryptoVal + '	config.salt :: ' + config.salt);
		return crypto.createHash('SHA256').update(cryptoVal + config.salt).digest('base64');
	},

	// aes-256-cbc iv
	aes256CryptoIv: function(cryptoVal) {
		var cipheriv = crypto.createCipheriv(config.aes256Alg, key, iv);
		var returnVal = cipheriv.update(cryptoVal, 'utf8', 'hex');
		returnVal += cipheriv.final('hex');
		logger.debug('cryptoUtil > aes256CryptoIv / cryptoVal :: ' + cryptoVal + '	cipheriv :: ' + cipheriv + '	returnVal :: ' + returnVal);
		return returnVal;
	},

	// de aes-256-cbc iv
	deAes256CryptoIv: function(deCryptoVal) {
		logger.debug('cryptoUtil > deAes256CryptoIv / deCryptoVal :: ' + deCryptoVal);
		if (!deCryptoVal) return '';
		var deCipheriv = crypto.createDecipheriv(config.aes256Alg, key, iv);
		var returnVal = deCipheriv.update(deCryptoVal, 'hex', 'utf8');
		returnVal += deCipheriv.final('utf8');
		logger.debug('cryptoUtil > deAes256CryptoIv / deCipheriv :: ' + JSON.stringify(deCipheriv) + '	returnVal :: ' + returnVal);
		return returnVal;
	},

	buffercipher: function(bufferData) {
		var localCipher = crypto.createCipher('aes-256-cbc', key)
		var encryptdata = localCipher.update(bufferData);
		encryptdata = Buffer.concat([ encryptdata, localCipher.final() ]);
		logger.debug('cryptoUtil > buffercipher / bufferData :: ' + JSON.stringify(bufferData) + '	localCipher :: ' + JSON.stringify(localCipher) + '	encryptdata :: ' + encryptdata);
		return encryptdata;
	},

	s3decipher: function(data) {
		var decoded = decipher.update(data);
		decoded = Buffer.concat([ decoded, decipher.final() ]);
		logger.debug('cryptoUtil > s3decipher / data :: ' + JSON.stringify(data) + '	decoded :: ' + decoded);
		return decoded;
	}
}

module.exports = cryptoUtil;