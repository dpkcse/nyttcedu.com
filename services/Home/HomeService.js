var _ = require("lodash");
var each = require('async-each');
var home_models = require("../../models/home");
var common_models = require("../../models/common");

class HomeService {
    constructor() {
			this.HOME_MODELS = home_models;
			this.COMMON_MODELS = common_models;
    }

    async getCourseNumberListDeptWise() {
			let total_course_no = 0;
			let data = {
				computer: 0,
				medical: 0,
				technical: 0,
				ecommerce: 0,
				hotelmanagement: 0,
				travelandtourism: 0,
				businessmanagement: 0,
				fashiondesign: 0,
				miscellaneous: 0,
				others: 0,
			};
			try {
				
				
				let t_computer = await this.HOME_MODELS.CourseNoDeptWiseListModel('computer', 1);
				if(t_computer.status && t_computer.result.length > 0) {
					data.computer = t_computer.result[0].computer;
				}
				let t_medical = await this.HOME_MODELS.CourseNoDeptWiseListModel('medical', 2);
				if(t_medical.status && t_medical.result.length > 0) {
					data.medical = t_medical.result[0].medical;
				}
				let t_technical = await this.HOME_MODELS.CourseNoDeptWiseListModel('technical', 3);
				if(t_technical.status && t_technical.result.length > 0) {
					data.technical = t_technical.result[0].technical;
				}
				let t_ecommerce = await this.HOME_MODELS.CourseNoDeptWiseListModel('ecommerce', 4);
				if(t_ecommerce.status && t_ecommerce.result.length > 0) {
					data.ecommerce = t_ecommerce.result[0].ecommerce;
				}
				let t_hotelmanagement = await this.HOME_MODELS.CourseNoDeptWiseListModel('hotelmanagement', 5);
				if(t_hotelmanagement.status && t_hotelmanagement.result.length > 0) {
					data.hotelmanagement = t_hotelmanagement.result[0].hotelmanagement;
				}
				let t_travelandtourism = await this.HOME_MODELS.CourseNoDeptWiseListModel('travelandtourism', 6);
				if(t_travelandtourism.status && t_travelandtourism.result.length > 0) {
					data.travelandtourism = t_travelandtourism.result[0].travelandtourism;
				}
				let t_businessmanagement = await this.HOME_MODELS.CourseNoDeptWiseListModel('businessmanagement', 7);
				if(t_businessmanagement.status && t_businessmanagement.result.length > 0) {
					data.businessmanagement = t_businessmanagement.result[0].businessmanagement;
				}
				let t_fashiondesign = await this.HOME_MODELS.CourseNoDeptWiseListModel('fashiondesign', 8);
				if(t_fashiondesign.status && t_fashiondesign.result.length > 0) {
					data.fashiondesign = t_fashiondesign.result[0].fashiondesign;
				}
				let t_miscellaneous = await this.HOME_MODELS.CourseNoDeptWiseListModel('miscellaneous', 9);
				if(t_miscellaneous.status && t_miscellaneous.result.length > 0) {
					data.miscellaneous = t_miscellaneous.result[0].miscellaneous;
				}

				_.each(data, (v, k) => {
					total_course_no += parseInt(v);
				});
				data.total_course_no = total_course_no;

				return {
					status: true,
					result: data
				}
			} catch(err) {
				data.total_course_no = 0;
				console.log(err);
				return {
					status: false,
					result: data
				}
			}
    }
    
}

module.exports = HomeService;