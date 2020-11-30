const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();

const apiRoutes = require('./api.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


let HttpModule = {};

HttpModule.init = function() {

	app.use('/api', apiRoutes());

    return new Promise(function(resolve, reject) {
		app.listen(2157, () => console.log(`SmartHub listening on port 2157!`))
    })

}


module.exports = HttpModule;