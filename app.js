function parseMatchDates(element){
    // Format date data
    var date = JSON.stringify(element.m_day);
    var month = date.slice(6, 8);
    var day = date.slice(9, 11);
    var year = date.slice(1, 5);
    element.month = month;
    element.day = day;
    element.year = year;
    // Format time data
    var time = JSON.stringify(element.m_time);
    var hour = parseInt(time.slice(1, 3));
    var minute = time.slice(4, 6);
    if(hour > 12){
        // Normalize hour
        hour = hour - 12;
        time = hour + ":" + minute + "pm";
    }else{
        time = hour + ":" + minute + "am";
    }
    element.time = time;
}

function formatLeagueDates(someLeague){
    var startDate = {};
    startDate = parseDate(JSON.stringify(someLeague.l_start_date));
    someLeague.l_start_date = startDate.month + "/" + startDate.day + "/" + startDate.year;
    var endDate = {};
    endDate = parseDate(JSON.stringify(someLeague.l_end_date));
    someLeague.l_end_date = endDate.month + "/" + endDate.day + "/" + endDate.year;
}

function parseDate(someDate){
    var newDate = {};
    newDate.month = someDate.slice(6, 8);
    newDate.day = someDate.slice(9, 11);
    newDate.year = someDate.slice(1, 5);

    return newDate;
}

function formatRank(intDay){
    var stringDay;

    // Format Rank
    switch(intDay){
        case 0:
            stringDay = "Bronze";
            break;
        case 1:
            stringDay = "Silver";
            break;
        case 2:
            stringDay = "Gold";
            break;
        case 3:
            stringDay = "Platinum";
            break;
        case 4:
            stringDay = "Diamond";
            break;
        case 5:
            stringDay = "Master";
            break;
        case 6:
            stringDay = "Grand Master";
            break;
        default:
            // Shouldn't occur
            console.log("No matching Rank");
    }

    return stringDay;
}

function formatDay(badDay){
    var goodDay;

    // Format Day
    switch(badDay) {
        case 0:
            goodDay = "Monday"
            break;
        case 1:
            goodDay = "Tuesday"
            break;
        case 2:
            goodDay = "Wednesday"
            break;
        case 3:
            goodDay = "Thursday"
            break;
        case 4:
            goodDay = "Friday"
            break;
        case 5:
            goodDay = "Saturday"
            break;
        case 6:
            goodDay = "Sunday"
            break;
        default:
            // Shouldn't be possible
            console.log("No matching day");
    }

    return goodDay;
}



/*********************************************************************
 * 
 *********************************************************************/
function getMatches(res, mysql, context, complete){
    //console.log("Getting matches...");
    var myQuery = "SELECT m_id, m_time, m_day, m_league, m_home, m_away, t1.t_name AS home, t2.t_name AS away, m_result, r.r_value AS result";
    myQuery = myQuery + " FROM `match` ";
    myQuery = myQuery + "INNER JOIN `team` t1 ON m_home = t1.t_id ";
    myQuery = myQuery + "INNER JOIN `team` t2 ON m_away = t2.t_id ";
    myQuery = myQuery + "INNER JOIN `result` r ON m_result = r_id";
    
    // Request all rows in match table from mysql database
    mysql.pool.query(myQuery, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.match = results;

        context.match.forEach(element => {
            parseMatchDates(element);
            
        });

        // Call callback function
        complete();
    });
}

function getMatch(res, mysql, context, complete){
    var myQuery = "SELECT M.m_time, M.m_day, HT.t_name AS home, AT.t_name AS away, R.r_value, L.l_skill_rank, L.l_division, L.l_day ";
    myQuery = myQuery + "FROM `match` M INNER JOIN team HT ON HT.t_id = M.m_home ";
    myQuery = myQuery + "INNER JOIN team AT ON AT.t_id = M.m_away ";
    myQuery = myQuery + "INNER JOIN result R ON R.r_id = M.m_result ";
    myQuery = myQuery + "INNER JOIN league L ON L.l_id = M.m_league WHERE M.m_id = ?;";

    mysql.pool.query(myQuery, context.id, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.match = results[0];
        parseMatchDates(context.match);
        context.match.l_skill_rank = formatRank(context.match.l_skill_rank);
        context.match.l_day = formatDay(context.match.l_day);
        complete();
    });
}

function getLeagues(res, mysql, context, complete){
    var myQuery = "SELECT l_id, l_day, l_skill_rank, l_division, l_start_date, l_end_date FROM `league` ";
    myQuery = myQuery + "ORDER BY l_day ASC, l_skill_rank DESC, l_division ASC;";
    mysql.pool.query(myQuery, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.league = results;
        context.league.forEach(element => {
            element.l_day = formatDay(element.l_day);
            element.l_skill_rank = formatRank(element.l_skill_rank);
            formatLeagueDates(element);
	    });
        // Call callback function
        complete();
    });

}

function getTeams(res, mysql, context, complete){

    var myQuery = "SELECT t_id, t_name FROM `team` t";
    console.log(context.leagueId);
    if(context.leagueId != undefined){
        console.log("Getting teams from league " + context.leagueId);
        myQuery = myQuery + " INNER JOIN `league_team` lt ON t.t_id = lt.t_id";
        myQuery = myQuery + " WHERE lt.l_id = " + context.leagueId;
    }
    mysql.pool.query(myQuery, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.team = results;

	// Call callback function
	complete();
    });
}


function getTeam(res, mysql, context, complete){
    var myQuery = "SELECT t_id, t_name FROM `team` WHERE t_id = ?";
    var inserts = [context.t_id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}
	context.team = results[0];
	console.log(context);
	// Call callback function
	complete();
    });
}

function removeTeam(res, mysql, context, complete){

    var myQuery = "DELETE FROM `team` WHERE t_id = (?)";
    var inserts = [context.id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.status(400);
	    res.end();
	}
	
	// Call callback function
	complete();
    });
}

function getTeamPlayers(res, mysql, context,  complete){
    var myQuery = "SELECT t.t_id, p.p_name FROM `team` t ";
    myQuery = myQuery + "INNER JOIN `player_team` pt ON t.t_id = pt.t_id ";
    myQuery = myQuery + "INNER JOIN `player` p ON pt.p_id = p.p_id ";
    myQuery = myQuery + "WHERE t.t_id = ?";
    var inserts = [context.t_id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}
	context.player = results;
	console.log(context.team);
        complete();
    });
}

function getTeamMatches(res, mysql, context, complete){
    var myQuery = "SELECT t.t_id, t1.t_id, m.m_day, m.m_time, m.m_home, m.m_away, t1.t_name as home, t2.t_name as away, r_value FROM `team` t ";
    myQuery = myQuery + "INNER JOIN `match` m ON t.t_id = m.m_home OR t.t_id = m.m_away ";
    myQuery = myQuery + "INNER JOIN `team` t1 ON m.m_home = t1.t_id ";
    myQuery = myQuery + "INNER JOIN `team` t2 on m.m_away = t2.t_id ";
    myQuery = myQuery + "INNER JOIN `result` r ON m.m_result = r.r_id ";
    myQuery = myQuery + "WHERE t.t_id = ?";
    var inserts = [context.t_id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}
	context.match = results;
	context.match.forEach(element => {
	    parseMatchDates(element);
	});
	console.log(context.match);
	complete();
    });
}

function removePlayerTeam(res, mysql, context, complete){

}

function removeLeague(res, mysql, context, complete){

    var myQuery = "DELETE FROM `league` WHERE l_id = (?)";
    var inserts = [context.id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.status(400);
	    res.end();
	}
	
	// Call callback function
	complete();
    });
}

function getLeague(res, mysql, context, complete){
    var myQuery = "SELECT l_day, l_skill_rank, l_division, l_start_date, l_end_date ";
    myQuery = myQuery + "FROM league WHERE l_id = ?";
    mysql.pool.query(myQuery, context.id, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.league = results[0];
        context.league.l_day = formatDay(context.league.l_day);
        context.league.l_skill_rank = formatRank(context.league.l_skill_rank);
        formatLeagueDates(context.league);
        complete();
    });
}

function getLeagueTeams(res, mysql, context, complete){
    var myQuery = "SELECT t.t_name, t.t_id FROM team t INNER JOIN league_team lt ON lt.t_id=t.t_id ";
    myQuery = myQuery + "INNER JOIN league l ON l.l_id = lt.l_id WHERE l.l_id = ?;";

    mysql.pool.query(myQuery, context.id, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.leagueTeam = results;
        complete();
    });
}

function getLeagueMatches(res, mysql, context, complete){
    var myQuery = "SELECT m_id, m_time, m_day, m_league, m_home, m_away, t1.t_name AS home, t2.t_name AS away, m_result, r.r_value AS result";
    myQuery = myQuery + " FROM `match` ";
    myQuery = myQuery + "INNER JOIN `team` t1 ON m_home = t1.t_id ";
    myQuery = myQuery + "INNER JOIN `team` t2 ON m_away = t2.t_id ";
    myQuery = myQuery + "INNER JOIN `result` r ON m_result = r_id ";
    myQuery = myQuery + "WHERE m_league = ? ORDER BY m_day ASC, m_time ASC;";

    mysql.pool.query(myQuery, context.id, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        // Assign results to context.match
        context.match = results;
        // Format dates of each match
        context.match.forEach(element => {
            parseMatchDates(element);
        });

        complete();
    });
}

function getPlayers(res, mysql, context, complete){
    var myQuery = "SELECT p_id, p_tag, p_name FROM `player`";
    mysql.pool.query(myQuery, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        //console.log(results); 
        // Assign the query response to context.player
        context.allPlayers = results;
	//console.log(context);

	// Call callback function
	complete();
    });
}

function getPlayer(res, mysql, context, id, complete){
    var myQuery = "SELECT p_id, p_tag, p_name FROM `player` WHERE p_id = ?";
    var inserts = [id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}
	context.player = results[0];
	console.log(context);
	// Call callback function
	complete();
    });
}

function removePlayer(res, mysql, context, complete){  

    var myQuery = "DELETE FROM `player` WHERE p_id = (?)";
    var inserts = [context.id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.status(400);
	    res.end();
	}
	
	// Call callback function
	complete();
    });
}

function getPlayerTeams(res, mysql, context, id, complete){
    var myQuery = "SELECT p.p_id, t.t_name FROM `player` p ";
    myQuery = myQuery + "INNER JOIN `player_team` pt ON p.p_id = pt.p_id ";
    myQuery = myQuery + "INNER JOIN `team` t ON pt.t_id = t.t_id ";
    myQuery = myQuery + "WHERE p.p_id = ?";
    var inserts = [id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}
	context.team = results;
	console.log(context.team);
        complete();
    });
}

function getPlayerMatches(res, mysql, context, id, complete){
    var myQuery = "SELECT p.p_id, t1.t_id, m.m_day, m.m_time, m.m_home, m.m_away, t2.t_name as home, t3.t_name as away, r_value FROM `player` p ";
    myQuery = myQuery + "INNER JOIN `player_team` pt ON p.p_id = pt.p_id ";
    myQuery = myQuery + "INNER JOIN `team` t1 ON pt.t_id = t1.t_id ";
    myQuery = myQuery + "INNER JOIN `match` m ON t1.t_id = m.m_home OR t1.t_id = m.m_away ";
    myQuery = myQuery + "INNER JOIN `team` t2 ON m.m_home = t2.t_id ";
    myQuery = myQuery + "INNER JOIN `team` t3 on m.m_away = t3.t_id ";
    myQuery = myQuery + "INNER JOIN `result` r ON m.m_result = r.r_id ";
    myQuery = myQuery + "WHERE p.p_id = ? ";
    myQuery = myQuery + "ORDER BY m.m_day ASC"
    var inserts = [id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}
	context.match = results;
	context.match.forEach(element => {
	    parseMatchDates(element);
	});
	console.log(context.match);
	complete();
    });
}

// Setup express
var express = require('express');
var app = express();

// Setup handlebars
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Setup SQL
var mysql = require('./public/dbcon.js');
app.set('mysql', mysql);

// Setup body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Setup public directory
const path = require('path');
app.use('/public', express.static(path.resolve(__dirname, 'public')));

// Setup port
app.set('port', 4862);

app.get('/', function(req, res){
    var context = {};
    context.styleSheet = ["owstyle.css", "home-style.css"];
    console.log(context);
    res.render('home', context);
});

app.get('/teams', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getTeams(res, mysql, context, complete);
    function complete(){
        callbackCount++;
	    if(callbackCount >= 1){
	        res.render('teams', context);
	    }
    }
});

app.post('/teams', function(req, res){
    var myQuery = "INSERT INTO `team` (t_name) values (?)";
    console.log(req.body);
    var inserts = [req.body.t_name];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}else{
	    res.redirect('/teams');
	}
    });
});

app.get('/removeTeam/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.id = req.params.id;
    context.styleSheet = ["owstyle.css", "home-style.css"];
    removeTeam(res, mysql, context, complete);
    function complete(){
	    callbackCount++;
	    if(callbackCount >= 1){
    	    context.styleSheet = ["owstyle.css", "home-style.css"];
	        getPlayers(res, mysql, context, refresh);
	        function refresh(){
	            res.redirect('/teams');
	        }
	    }
    }
});

app.get('/team/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.t_id = req.params.id;
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getTeam(res, mysql, context, complete);
    getTeamPlayers(res, mysql, context, complete);
    getTeamMatches(res, mysql, context, complete);
    getPlayers(res, mysql, context, complete);
    function complete(){
	callbackCount++;
	if(callbackCount >= 4){
	    res.render('teamProfile', context);
	}
    }
});

app.post('/addPlayerTeam/', function(req, res){
    var myQuery = "INSERT INTO `player_team` (p_id, t_id) values (?, ?)";
    console.log("p_id = " + req.body.p_id);
    console.log("t_id = " + req.body.t_id);
    var inserts = [req.body.player, req.body.t_id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.string.stringify(error));
	    res.end();
	}else{
	    var someUrl = '/team/' + req.body.t_id;
	    res.redirect(someUrl);
	}
    });
});

app.get('/players', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getPlayers(res, mysql, context, complete);
    function complete(){
        callbackCount++;
        if(callbackCount >= 1){
            console.log(context);
            res.render('players', context);
        }
    }
});

app.get('/player/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    getPlayer(res, mysql, context, req.params.id, complete);
    getPlayerTeams(res, mysql, context, req.params.id, complete);
    getPlayerMatches(res, mysql, context, req.params.id, complete);
    context.styleSheet = ["owstyle.css", "home-style.css"];
    function complete(){
	callbackCount++;
	if(callbackCount >= 3){
	    res.render("playerProfile", context);
	}
    }
});

app.post('/players', function(req, res){
    var myQuery = "INSERT INTO `player` (p_tag, p_name) values (?, ?)";
    console.log(req.body);
    var inserts = [req.body.p_tag, req.body.p_name];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}else{
	    res.redirect('/players');
	}
    });
});

app.get('/removePlayer/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.id = req.params.id;
    context.styleSheet = ["owstyle.css", "home-style.css"];
    removePlayer(res, mysql, context, complete);
    function complete(){
	callbackCount++;
	if(callbackCount >= 1){
    	context.styleSheet = ["owstyle.css", "home-style.css"];
	    getPlayers(res, mysql, context, refresh);
	    function refresh(){
	        res.redirect('/players');
	    }
	}
    }
});

app.get('/leagues', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getLeagues(res, mysql, context, complete);
    function complete(){
        callbackCount++;
        if(callbackCount >= 1){
            res.render('leagues', context);
        }
    }
});

app.post('/leagues', function(req, res){ 
    var myQuery = "INSERT INTO `league` (l_day, l_skill_rank, l_division, l_start_date, l_end_date) values (?, ?, ?, ?, ?)";
    console.log(req.body);
    var inserts = [req.body.day, req.body.skill, req.body.division, req.body.start_date, req.body.end_date];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.stringify(error));
	    res.end();
	}else{
	    res.redirect('/leagues');
	}
    });
});

app.get('/removeLeague/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.id = req.params.id;
    context.styleSheet = ["owstyle.css", "home-style.css"];
    removeLeague(res, mysql, context, complete);
    function complete(){
        callbackCount++;
        if(callbackCount >= 1){
            getLeagues(res, mysql, context, refresh);
            function refresh(){
                res.render('leagues', context);
            }
        }
    }
});

app.get('/league/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.id = req.params.id;
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getLeague(res, mysql, context, complete);
    getLeagueTeams(res, mysql, context, complete);
    getLeagueMatches(res, mysql, context, complete);
    getTeams(res, mysql, context, complete);
    function complete(){
        callbackCount++;
        if(callbackCount >= 4){
            res.render('league-profile', context);
        }
    }

});

app.post('/addTeamLeague/', function(req, res){
    var myQuery = "INSERT INTO `league_team` (l_id, t_id) values (?, ?)";
    var inserts = [req.body.l_id, req.body.t_id];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
	if(error){
	    res.write(JSON.string.stringify(error));
	    res.end();
	}else{
	    var someUrl = '/league/' + req.body.l_id;
	    res.redirect(someUrl);
	}
    });
});

app.get('/matches', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getMatches(res, mysql, context, complete);
    function complete(){
        callbackCount++;
        if(callbackCount >= 1){
            res.render('matches', context);
        }
    }
});

app.post('/matches', function(req, res){
    var myQuery = "INSERT INTO `match` (m_time, m_day, m_league, m_home, m_away, m_result) values (?, ?, ?, ?, ?, ?);";
    var inserts = [req.body.time, req.body.day, req.body.l_id, req.body.home, req.body.away, 1];
    mysql.pool.query(myQuery, inserts, function(error, results, fields){
        if(error){
            res.write(JSON.string.stringify(error));
            res.end();
        }else{
            var someUrl = '/league/' + req.body.l_id;
            res.redirect(someUrl);
        }
    });
});

app.get('/match/:id', function(req, res){
    var callbackCount = 0;
    var context = {};
    context.id = req.params.id;
    context.styleSheet = ["owstyle.css", "home-style.css"];
    getMatch(res, mysql, context, complete);
    function complete(){
        callbackCount++;
        if(callbackCount >= 1){
            res.render('edit-match', context);
        }
    }
});

app.listen(app.get('port'), function(){ 
    console.log('Example app listening on port 4862!');
});
