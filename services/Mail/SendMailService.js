const nodemailer = require('nodemailer');
const _ = require("lodash");
var moment = require('moment');
var os = require("os");


class SendMailService {
    constructor() {
        // this.from = 'info@bttcedubd.com';
        // this.pass = 'info??1997bttcedubd';

        this.from = 'no-reply-auto-mail@nyttcedu.com';
        this.pass = 'AmaroParanoJahaChay@123*321#TumiTai';

        this.transporter = nodemailer.createTransport({
            // service: 'gmail',
            host: 'bttcedubd.com',
            // host: 'premium109.web-hosting.com',
            port: '465',
            secure: true, // true for 465, false for other ports
            auth: {
                user: this.from,
                pass: this.pass
            }
        });

        this.mailOptions = {
            from: {
                name: 'NYTTC',
                address: this.from
            },
            to: '',
            bcc: 'kallolray94@gmail.com',
            subject: '',
            html: '',
            attachments: []
        };
    }

    MailToAdminResetPassword(useremail, token, current_url) {
        return new Promise((resolve, reject) => {
            try {
                const _token = token;
                const _useremail = useremail;
                const _current_url = current_url;
                // console.log(_current_url, _useremail, _token)
                let msgStyle = '';
                let msgContent = '';
                let msg =   '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">' +
                            '<html xmlns="http://www.w3.org/1999/xhtml">' +
                                '<head>'+
                                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
                                    '<title>NYTTC</title>' +
                                    '<style type="text/css">';
                                        msgStyle = '.reset { background: #28a745; color: #FFF !important; padding: 10px 15px; border-radius: 5px; text-decoration: none;} .reset:hover {background-color: #17a2b8;}';
                                        msg += msgStyle;
                                    msg += '</style>' +
                                '</head>'+
                                '<body>' +
                                    '<h3>NYTTC Reset Password</h3>' +
                                    '<h3>It is an auto generated mail please no reply or mail to this address.</h3>' +
                                    '<h4>Please Click The Button For Reset Password: <a class="reset" href="'+_current_url +'?useremail='+_useremail+'&token='+_token +'" target="_blank">Click Here</a></h4>' +
                                    '<br></br>'+
                                    '<h5>Thank you for using <a href="https://nyttcedu.com" target="_blank">NYTTC</a> system.</h5>' +
                                    '<h4>Design & Developed By Kallol Ray @DnKFlocks, kallolray94@gmail.com, 01727-379068</h4>' +
                                '</body>' +
                            '</html>';
                // console.log(msg)
                this.mailOptions.to = _useremail;
                this.mailOptions.subject = "NYTTC - Reset Admin Login Password";
                this.mailOptions.html = msg;
                
                this.transporter.sendMail(this.mailOptions, function(error, info){
                    if (error) {
                        console.log("error = ", error)
                        resolve ({
                            status: false,
                            err: error
                        });
                    } else {
                        console.log("info = ", info)
                        resolve ({
                            status: true,
                            result: info,
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


