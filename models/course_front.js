const course_front = {};

// course_front.getTopProductsModel = async function getTopProductsModel(totalNo){
    // return new Promise((resolve,reject)=>{        
    //     db.query('SELECT pl.*, SUM(oid.qty) AS TotalQuantity FROM product_list pl INNER JOIN oder_item_detail oid ON pl.id = oid.product_id GROUP BY oid.product_id ORDER BY SUM(oid.qty) DESC LIMIT ?', totalNo, function(error, result, fields) {            
    //         if(error) {
    //             reject({ status: false, err: error });
    //         } else {
    //             // console.log("Products ==========================", result);
    //             resolve({ status: true, result: result});
    //         }
    //     });
    // });
// }

module.exports = course_front;