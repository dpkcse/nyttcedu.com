var moment = require('moment');
const HomeService = require( "../../services/Home/HomeService");

var self = (module.exports = {
	HomeLanding : async function (req, res, next) {
		try {
			let data = {
                title : 'Home',
                moment: moment
            };
            const CourseNoIns = new HomeService();
            let courseNo = await CourseNoIns.getCourseNumberListDeptWise();
            data.course_total = courseNo.result;
			res.render('front_view/index.ejs', data);
		} catch ( err ) {
			console.log(err);
			res.status( 500 ).json( err );
		}
	},

    // GetNewArrival : async function (req, res, next) {
    //     try {
    //         res.header("Access-Control-Allow-Origin", "*");
    //         res.setHeader('Content-Type', 'application/json');
    //         let newProductNo = 20;
    //         const NewProductIns = new HomeService();
    //         var newProductList = await NewProductIns.GetNewProductListService(newProductNo);
    //         // console.log("newProductList = ", newProductList);

    //         if(newProductList.status) {
    //             res.status( 200 ).json( newProductList );
    //         } else {
    //             res.status( 500 ).json(newProductList.err);
    //         }
    //     } catch ( err ) {
    //         res.header("Access-Control-Allow-Origin", "*");
    //         res.setHeader('Content-Type', 'application/json');
    //         res.status( 500 ).json( err );
    //     }
    // },
});