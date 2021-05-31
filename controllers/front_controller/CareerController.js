var moment = require('moment');

var self = (module.exports = {
	JobVacancy : async function (req, res, next) {
		try {
			let data = {
        title : 'Career',
        moment: moment
			};
			res.render('front_view/career', data);
			// res.render('err_404', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

});