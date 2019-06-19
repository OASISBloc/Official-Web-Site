const router = require('express').Router()
const controller = require('../../../controller/api/user.controller')

router.get('/list', controller.list)

module.exports = router