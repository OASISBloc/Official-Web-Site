var mysql = require('mysql');

/**
 * mysql Connection info
 */
var connection = mysql.createPool({
    host    : 'host',
    user    : 'account',
    password: 'password',
    port    : 'port',
    database: 'database name',
    multipleStatements: true
});

//connection.connect();

module.exports = {
    'domain' : 'site domain',
    'homeUrl' : 'site home url',
    'secret' : 'scret key',
    'salt' : '{sha256 key}',
    'aes256Alg' : 'aes-256-cbc',
    'aes256Key' : 'aes-256-cbc key',
    'aes256Iv' : 'aes-256-iv key',
    'gmailId': '',
    'gmailPw': '',
    'supportEmail' : 'support email',
    'webmasterEmail' : 'web master email',
    'icoProvider' : 'otp provider name', 
    'icoHost' : 'otp host name',
    'connection' : connection,
    'recaptchaSite' : 'recaptcha site',
    'recaptchaSecret' : 'recaptcha key',
    'awsEmailHost': 'aws smtp host',
    'awsEmailPort': 000,
    'awsEmailId': 'aws smtp id',
    'awsEmailPw': 'aws smtp password',
    'redisHost': 'redis ip',
    'redisPort': 0000,
    'redisPw': 'redis password',
    'ETHWallet': 'ETH wallet address',
    'WalletNetworkType': 'wallet network type',
    'BTCMin': 0, 
    'ETHMin': 0
}