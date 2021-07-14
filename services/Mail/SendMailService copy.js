const nodemailer = require('nodemailer');
const _ = require("lodash");
var moment = require('moment');

class SendMailService {
    constructor() {        
        this.from = '';
        this.pass = '';

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.from,
                pass: this.pass
            }
        });

        this.mailOptions = {
            from: this.from,
            to: '',
            subject: '',
            html: '',
            attachments: []
        };
    }

    MailOrderPlace(customer, order, orderPlace, cart, customerEmail) {
        return new Promise((resolve, reject) => {
            try {
                const customerInfo = customer;
                const mainOrderInfo = order;
                const orderPlaceItem = orderPlace;
                const cartInfo = cart;
                const custEmail = customerEmail;
                
                let msgStyle = '';
                let msgContent = '';
                let msg = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'+
                '<html xmlns="http://www.w3.org/1999/xhtml">'+
                '<head>'+
                '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />'+
                '<title>Rivigassecret.com</title>'+
                    '<style type="text/css">';
                        msgStyle = '#outlook a { padding: 0; } body { width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; margin: 0; padding: 0; font-family: Helvetica, arial, sans-serif; } .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .backgroundTable { margin: 0; padding: 0; width: 100% !important; line-height: 100% !important; } .main-temp table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: Helvetica, arial, sans-serif; } .main-temp table td { border-collapse: collapse; }';
                        msg += msgStyle;
                    msg = +'</style>' +
                '</head>'+
                '<body>';
                    msgContent = '<table width="100%" cellpadding="0" cellspacing="0" border="0" class="backgroundTable main-temp" style="background-color: #D5D5D5;">' +
                        '<tbody>' +
                            '<tr>' +
                                '<td>' +
                                    '<table width="600" align="center" cellpadding="15" cellspacing="0" border="0" class="devicewidth" style="background-color: #FFFFFF;">' +
                                        '<tbody>' +
                                            '<tr>' +
                                                '<td style="padding-top: 30px;">' +
                                                    '<table width="560" align="center" cellpadding="0" cellspacing="0" border="0" class="devicewidthinner" style="border-bottom: 1px solid #EEEEEE; text-align: center;">' +
                                                        '<tbody>' +
                                                            '<tr>' +
                                                                '<td style="padding-bottom: 10px;">' +
                                                                    '<a href="https://www.rivigassecret.com">' +
                                                                        '<img src="https://riyadhtrading.sfo2.cdn.digitaloceanspaces.com/rivigassecret/banners/logo.png" alt="rivigassecret.com" />' +
                                                                    '</a>' +
                                                                '</td>' +
                                                            '</tr>' +
                                                            '<tr>' +
                                                                '<td style="font-size: 14px; line-height: 18px; color: #666666;"> rivigassecret.com </td>' +
                                                            '</tr>' +
                                                            '<tr>' +
                                                                '<td style="font-size: 14px; line-height: 18px; color: #666666;"> sales@rivigassecret.com </td>' +
                                                            '</tr>' +
                                                            '<tr>' +
                                                                '<td style="font-size: 14px; line-height: 18px; color: #666666; padding-bottom: 25px;"> <strong>Order Number:</strong> ' + 
                                                                orderPlaceItem.order_code +
                                                                '. | <strong>Order Date:</strong> ' + moment().format('LLL') + 
                                                                ' </td>' +
                                                            '</tr>' +
                                                        '</tbody>' +
                                                    '</table>' +
                                                '</td>' +
                                            '</tr>' +
                                            '<tr>' +
                                                '<td style="padding-top: 0;">' +
                                                    '<table width="560" align="center" cellpadding="0" cellspacing="0" border="0" class="devicewidthinner" style="border-bottom: 1px solid #BBBBBB; text-align: center;">' +
                                                        '<tbody>' +
                                                            '<tr>' +
                                                                '<td style="width: 55%; font-size: 16px; font-weight: bold; color: #666666; padding-bottom: 5px;"> Delivery Adderss </td>' +
                                                            '</tr>' +
                                                            '<tr>' +
                                                                '<td style="width: 55%; font-size: 16px; font-weight: bold; color: #666666; padding-bottom: 5px;">Customer Phone: '+customerInfo.phone+'</td>' +
                                                            '</tr>' +
                                                            '<tr>' +
                                                                '<td style="width: 55%; font-size: 14px; line-height: 18px; color: #666666;"> ' + customerInfo.address + ', ' + customerInfo.city + ', ' + customerInfo.country +', ZIP: ' + customerInfo.zip_code +' </td>' +
                                                            '</tr>' +
                                                        '</tbody>' +
                                                    '</table>' +
                                                '</td>' +
                                            '</tr>';
                
                                    _.each(cartInfo, (v, k) => {
                                        this.mailOptions.attachments.push({
                                            filename: v.images[0].src,
                                            path: "https://riyadhtrading.sfo2.cdn.digitaloceanspaces.com/" + v.images[0].src ,
                                            cid: k+'@rivigassecret.com' //same cid value as in the html img src
                                        });
                                        msgContent += '<tr>' +
                                            '<td style="padding-top: 0;">' +
                                                '<table width="560" align="center" cellpadding="0" cellspacing="0" border="0" class="devicewidthinner" style="border-bottom: 1px solid #EEEEEE;">' +
                                                    '<tbody>' +
                                                        '<tr>' +
                                                            '<td rowspan="4" style="padding-right: 10px; padding-bottom: 10px;">' +
                                                                '<img style="height: 80px;" src="cid:'+k+'@rivigassecret.com" alt="' + v.title + '" />' +
                                                            '</td>' +
                                                            '<td colspan="2" style="font-size: 14px; font-weight: bold; color: #666666; padding-bottom: 5px;"> ' + v.title + ' </td>' +
                                                        '</tr>' +
                                                        '<tr>' +
                                                            '<td style="font-size: 14px; line-height: 18px; color: #757575; width: 440px;"> Quantity: ' + v.quantity + ' </td>' +
                                                            '<td style="width: 130px;"></td>' +
                                                        '</tr>' +
                                                        '<tr>' +
                                                            '<td style="font-size: 14px; line-height: 18px; color: #757575;"> Color: ' + v.colorT + ' </td>' +
                                                            '<td style="font-size: 14px; line-height: 18px; color: #757575; text-align: right;"> ' + parseFloat(v.price).toFixed(2) + ' X '+v.quantity + ' ' + process.env.CURRENCY + ' </td>' +
                                                        '</tr>' +
                                                        '<tr>' +
                                                            '<td style="font-size: 14px; line-height: 18px; color: #757575; padding-bottom: 10px;"> Size: ' + v.sizeT + ' </td>' +
                                                            '<td style="font-size: 14px; line-height: 18px; color: #757575; text-align: right; padding-bottom: 10px;"> <b style="color: #666666;">' + parseFloat(parseFloat(v.quantity) * parseFloat(v.price)).toFixed(2) + ' ' + process.env.CURRENCY + '</b></td>' +
                                                        '</tr>' +
                                                    '</tbody>' +
                                                '</table>' +
                                            '</td>' +
                                        '</tr>';
                                    });
                                    msgContent += '<tr>' +
                                        '<td style="padding-top: 0;">' +
                                            '<table width="560" align="center" cellpadding="0" cellspacing="0" border="0" class="devicewidthinner" style="border-bottom: 1px solid #BBBBBB; margin-top: -5px;">' +
                                                '<tbody>' +
                                                    '<tr>' +
                                                        '<td style="font-size: 14px; font-weight: bold; line-height: 18px; color: #666666; padding-top: 10px;"> Sub Total </td>' +
                                                        '<td style="font-size: 14px; font-weight: bold; line-height: 18px; color: #666666; padding-top: 10px; text-align: right;"> ' + parseFloat(mainOrderInfo.sub_total).toFixed(2) + ' ' + process.env.CURRENCY + ' </td>' +
                                                    '</tr>' +
                                                    '<tr>' +
                                                        '<td style="font-size: 14px; line-height: 18px; color: #666666; padding-top: 10px;"> VAT </td>' +
                                                        '<td style="font-size: 14px; line-height: 18px; color: #666666; padding-top: 10px; text-align: right;"> ' + parseFloat(mainOrderInfo.vat_amount).toFixed(2) + ' ' + process.env.CURRENCY + ' </td>' +
                                                    '</tr>' + 
                                                    '<tr>' +
                                                        '<td style="font-size: 14px; line-height: 18px; color: #666666; "> Delivery Charge: </td>' +
                                                        '<td style="font-size: 14px; line-height: 18px; color: #666666; text-align: right;"> ' + parseFloat(mainOrderInfo.delivery_charge).toFixed(2) + ' ' + process.env.CURRENCY + ' </td>' +
                                                    '</tr>' +
                                                    '<tr>' +
                                                        '<td style="font-size: 14px; line-height: 18px; color: #666666; padding-bottom: 10px; border-bottom: 1px solid #EEEEEE;"> Discount: </td>' +
                                                        '<td style="font-size: 14px; line-height: 18px; color: #666666; padding-bottom: 10px; border-bottom: 1px solid #EEEEEE; text-align: right;"> ' + parseFloat(mainOrderInfo.discount_percent_amount == 0 ? mainOrderInfo.discount : mainOrderInfo.discount_percent_amount).toFixed(2) + ' ' + process.env.CURRENCY + ' </td>' +
                                                    '</tr>' +
                                                    '<tr>' +
                                                        '<td style="font-size: 14px; font-weight: bold; line-height: 18px; color: #666666; padding-top: 10px;"> Order Total </td>' +
                                                        '<td style="font-size: 14px; font-weight: bold; line-height: 18px; color: #666666; padding-top: 10px; text-align: right;"> ' + parseFloat(parseFloat(mainOrderInfo.total_val) - parseFloat(mainOrderInfo.discount)).toFixed(2) +
                                                        
                                                        ' ' + process.env.CURRENCY + ' </td>' +
                                                    '</tr>' +
                                                    '<tr>' +
                                                        '<td style="font-size: 14px; font-weight: bold; line-height: 18px; color: #666666;"> Payment Term: </td>' +
                                                        '<td style="font-size: 14px; font-weight: bold; line-height: 18px; color: #666666; text-align: right;"> COD </td>' +
                                                    '</tr>' +
                                                '</tbody>' +
                                            '</table>' +
                                            '</td>' +
                                            '</tr>' +
                                            '<tr>' +
                                                '<td style="padding: 0 10px;">' +
                                                    '<table width="560" align="center" cellpadding="0" cellspacing="0" border="0" class="devicewidthinner">' +
                                                        '<tbody>' +
                                                            '<tr>' +
                                                                '<td colspan="2" style="width: 100%; text-align: center; font-style: italic; font-size: 13px; font-weight: 600; color: #666666; padding: 15px 0; border-top: 1px solid #EEEEEE;"> <b style="font-size: 14px;">Note:</b> Thank You </td>' +
                                                            '</tr>' +
                                                        '</tbody>' +
                                                    '</table>' +
                                                '</td>' +
                                            '</tr>' +
                                        '</tbody>' +
                                    '</table>' +
                                    '</td>' +
                                '</tr>' +
                            '</tbody>' +
                        '</table>';                        
                        msg += msgContent;
                    msg += '</body>' +
                '</html>';

                this.mailOptions.to = custEmail;
                this.mailOptions.subject = "Riviga's Secret - An order placed successfully.";
                this.mailOptions.html = msg;
                
                this.transporter.sendMail(this.mailOptions, function(error, info){
                    if (error) {
                        resolve ({
                            status: false,
                            err: error
                        });
                    } else {
                        resolve ({
                            status: true,
                            result: info.response,
                            invoice: {
                                style: msgStyle,
                                content: msgContent,
                            }
                        });
                    }
                });
            } catch(err) {
                console.log(err);
                reject ({
                    status: false,
                    err: err
                });
            }
        });
    }


}

module.exports = SendMailService;


