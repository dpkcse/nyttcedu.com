var moment = require('moment');
// const FaqService = require( "../services/Home/FaqService");

var self = (module.exports = {
	FaqViewController : async function (req, res, next) {
		try {
			let data = {
				title : 'Faqs',
				moment: moment
			};
			res.render('front_view/faqs', data);
			// res.render('err_404', data);
		} catch ( err ) {
			console.log(err);
			res.status( 500 ).json( err );
		}
	},
});