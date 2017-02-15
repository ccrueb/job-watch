var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var config = require("./config.json");

// This is the latest job that was sent
var sentIDs = [];
// 30 minutes between requests
var REQUEST_INTERVAL = 1000 * 60 * 30;

//URLs for searching
var urls = ['https://jobcenter.wisc.edu/jobs/categoryBrowse/Computers/0/',
    'https://jobcenter.wisc.edu/jobs/categoryBrowse/Computers/1/'];


function searchPagesForNewJobs(url) {

    //Get html from each page in urls
    for (var x in urls) {
        request(urls[x], getIdsFromHTML);
    }
};

function getIdsFromHTML(err, res, html) {
    //Print error
    if(err) {
        return console.log(err);
    }
    //Get data from every first td
    var $ = cheerio.load(html);
    $('td:first-child').each(function() {
        var data = $(this).text();
        if (!isNaN(data) && sentIDs.indexOf(data) === -1) {
            console.log(new Date().toDateString() + ' New ID found: ' + data);
            //update sendIDS

            //send email

        }
    });
};

function emailJob(id) {
    request('https://jobcenter.wisc.edu/jobs/detail/' + id, function (err, res, body) {
        if (err) {
            return console.log(err);
        }

        var $ = cheerio.load(body);

        var mailOptions = {
            from: '"Calmail"', // sender address
            to: 'calvin.c.rueb@gmail.com', // list of receivers
            subject: 'New job: ' + id, // Subject line
            text: 'Something went wrong', // plain text body
            html: $('table').html() // html body
        };
        //Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    });
};

//set interval for search
setInterval(() => { searchPagesForNewJobs(); }, REQUEST_INTERVAL);

//Run on startup
// loadConfig();
// loadSavedIds();
searchPagesForNewJobs();