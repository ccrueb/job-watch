var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var config = require("./config.json");
var fs = require('fs');

// This is the latest job that was sent
var sentIDs = [];
// 30 minutes between requests
var REQUEST_INTERVAL = 1000 * 60 * 30;

//URLs for searching
var urls = ['https://jobcenter.wisc.edu/jobs/categoryBrowse/Computers/0/',
    'https://jobcenter.wisc.edu/jobs/categoryBrowse/Computers/1/'];

//Email settings
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email_user,
        pass: config.email_pass
    }
});

//Requests all urls
function searchPagesForNewJobs(url) {

    //Get html from each page in urls
    for (var x in urls) {
        request(urls[x], getIdsFromHTML);
    }
};

//Finds all IDs from table. Ids are always found in first column
function getIdsFromHTML(err, res, html) {
    //Print error
    if (err) {
        return console.log(err);
    }
    //Get data from every first td
    var $ = cheerio.load(html);
    $('td:first-child').each(function () {
        var data = $(this).text().trim();
        //Check if number to ignore "job id" title field
        if (!isNaN(data) && sentIDs.indexOf(data) == -1) {
            console.log(new Date().toDateString() + ' New ID found: ' + data);
            //update sendIDS
            saveId(data);
            //send email
            emailJob(data);
        }
    });
};

//Requests job page and emails html
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
            console.log(new Date().toDateString() + ' Email sent: ' + id);
        });
    });
};

//Saves id to array and appends to file
function saveId(id) {
    
    //Add id to array in RAM and save to txt doc
    sentIDs.push(id);
    fs.appendFile('savedIDs.txt', id + ' ', function (err) {
        if(err) {
            console.log(err)
        }
    });
}

//loads all sent IDs from txt file
function load() {
    fs.readFile('savedIDs.txt', function(err, data) {
        sentIDs = data.toString().split(' ');
    }) 
}

//set interval for search
setInterval(() => { searchPagesForNewJobs(); }, REQUEST_INTERVAL);

//Run on startup
load();
searchPagesForNewJobs();