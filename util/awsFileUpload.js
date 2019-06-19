let multer = require('multer')
var storage = multer.memoryStorage()
const upload = multer({storage: storage, limits: { fileSize: 10 * 1024 * 1024 }})
let AWS = require('aws-sdk')
var cryptoFile = require('../util/crypto')
const fs = require('fs');
const logger = require('./logger');

AWS.config.loadFromPath(__dirname + '/../config/awsconfig.json')
var awsJson = JSON.parse(fs.readFileSync(__dirname + '/../config/awsconfig.json'));
let s3 = new AWS.S3();

var s3Upload = {

    encUpload : function(req, res, uploadFolder, file, callback) {
        logger.debug('s3Upload > encUpload / uploadFolder :: ' + JSON.stringify(uploadFolder));
        var uploads = upload.single(file.fieldname);
        uploads(req, res, function(err) {
            file.buffer = cryptoFile.buffercipher(file.buffer);
            var fileName = new Date().valueOf() +".enc";
            file['encFileName'] = fileName;

            var params = {
                Bucket: `s3.oasisbloc/${uploadFolder}`,
                Key: fileName,
                Body: file.buffer
            };
            logger.debug('s3Upload > encUpload / s3.putObject params :: ' + JSON.stringify(params));
            s3.putObject(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    logger.error('s3Upload > encUpload / s3.putObject error :: ' + JSON.stringify(err));
                    callback(err);
                } else {
                    var s3url = `https://s3.${awsJson.region}.amazonaws.com/${params.Bucket}/${fileName}`;
                    logger.debug('s3Upload > encUpload / s3.putObject s3url :: ' + s3url);
                    file['saveFile'] = s3url;

                    callback(null, file);
                }    
            });   
        });
    },
    delete : function(deleteFolder, fileName, callback) {
        var params = {
            Bucket: `s3.oasisbloc/${deleteFolder}`,
            Key: fileName
        };
        logger.debug('s3Upload > encUpload / s3.deleteObject params :: ' + JSON.stringify(params));
        s3.deleteObject(params, function(err, result) {
            if (err) {
                logger.debug('s3Upload > encUpload / s3.deleteObject error :: ' + JSON.stringify(err));
                callback(err);
            } else {
                logger.debug('s3Upload > encUpload / s3.deleteObject result :: ' + JSON.stringify(result));
                callback(null, result);
            }    
        });   
    },
    downloadFile : function(downFile, boardType, callback) {
        var param = {
            Bucket: 's3.oasisbloc/' + boardType,
            Key: downFile
        };
        s3.getObject(param, function(err, data) {
            if (err){
                console.log(err, err.stack); // an error occurred
            }

            callback(null, data);
        })
    }
}
module.exports = s3Upload