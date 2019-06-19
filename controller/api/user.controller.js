var User = require('../../models/user')

/* 
    GET /api/user/list
*/
var userController = {

    list: function (req, res) {

        User.getAllUsers(function(err, rows){

            if(err)
            {
                res.json(err);
            }
            else
            {
                res.json(rows);
            }
        
        });

    }
}

module.exports = userController;