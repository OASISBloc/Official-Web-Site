const crypto = require('crypto')

var User = {
    getAllUsers: function (callback) {
        config.connection.getConnection(function (err, connection) {
            var sql = 'SELECT id,title FROM topic';
            
            connection.query(sql, callback);
            connection.release();
            //config.connection.destroy();
        });
    },  
    getlist: function(){

    }
}
//config.connection.destroy();
module.exports = User;

