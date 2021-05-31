
var moment = require('moment');
const DashboardService = require( "../../services/Dashboard/DashboardService");
const CommonService = require("../../services/Common/CommonService");

var self = (module.exports = {
	MainDashboard : async function (req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			
			// const DashboardService = new DashboardService();
			// var DashboardList = await DashboardService.GetDashboardListService();

			let data = {
				title : 'Admin | Dashboard',
				menu : 'Dashboard',
				sub_menu: 'Dashboard',
				route: '/dashboard',
				moment: moment,
				user_info: user_info,
			};
			res.render('system_admin/dashboard.ejs', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},
});