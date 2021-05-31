var express = require('express');
var router 	= express.Router();
var path    = require('path');
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");

// router.get('/', ensureAuthenticated, (req, res) => {
router.get('/', (req, res) => {
	// console.log(path.join(__dirname + 'bttcedubd_error.log'))
  res.sendFile(path.join(__dirname + '../../../bttcedubd_error.log'));
});

module.exports = router;