$(function() {
    console.log("Battleship Client");
    var countL = 0;
    var countuB = 0;
    var countW = 0;
    var kurskV = 0;

    var CLIENT = {
        token : $.cookie('token'),
        //        serverUrl: "http://battleships/", /* UPDATE HERE */
        serverUrl : "http://battleships-master-env-kummkavdrx.elasticbeanstalk.com/", /* UPDATE HERE */
        body : $(".body"),
        header : $(".header"),
        name : 'Player',
        currentGame : "",
        currentGameId : "",
        nextShootX : -1,
        nextShootY : -1,
 
        serverUrlWithToken : function() {
            return this.serverUrl + this.token + "/";
        },
        shootUrl : function(x, y) {
            return this.serverUrlWithToken() + "game/" + this.currentGameId + "/shoot/?x=" + x + "&y=" + y;
        },
        createGame : function() {
            var that = this;
            console.log("create game");
            that.body.empty().append('<p>Creating a new game...</p>');
            $.getJSON(that.serverUrlWithToken() + "game/new?callback=?", function(response) {
                console.log("success");
                console.log("response=" + response);

                if ( typeof response.error !== 'undefined') {
                    console.error(response.error);
                } else {
                    var msg = "New Game created ID=" + response.id;
                    console.log(msg);
                    alert(msg);
                    that.currentGameId = response.id;
                    that.playGame();
                }
            });
        },
        joinGame : function(gameId) {
            console.log("joining game " + gameId);
            var that = this;
            $.getJSON(that.serverUrlWithToken() + 'game/' + gameId + '/join?callback=?', function(response) {
                that.body.empty().append('<p>' + response.msg + '</p><button class="playGame" value="' + gameId + '">Play</button>');
            });
        },
        listGames : function(url, callback) {
            var that = this;
            that.body.empty().append('<p>Loading...</p>');
            $.getJSON(url + "?callback=?", function(response) {
                if ( typeof response.error !== 'undefined') {
                    console.error(response.error);
                } else if (response.length === 0) {
                    that.body.empty();
                    alert('No games on the list');
                } else {
                    console.log("List of available games");
                    that.body.empty();
                    $.each(response, function() {
                        var player1 = 'NO PLAYER 1';
                        var player2 = '-';
                        if ( typeof this.players !== 'undefined' && this.players.length > 0) {
                            player1 = this.players[0].name;
                            if (this.players.length == 2) {
                                player2 = this.players[1].name;
                            }
                        }

                        that.body.append($("<div class='game'>").append($('<button>', {
                            value : this.id,
                            text : 'Join'
                        })).append("<p>Player1: " + player1 + "</p><p>Player2: " + player2 + "</p><p>Game Id= " + this.id + "</p><p>STATUS: " + this.status + "</p>"));
                    });
                }
                if ( typeof callback !== 'undefined') {
                    callback();
                }
            });
        },
        listOpenGames : function() {
            this.listGames(this.serverUrlWithToken() + "game/list");
        },
        listAllGames : function() {
            var that = this;
            this.listGames(this.serverUrl + "game/list", function() {
                that.body.find("button").remove();
            });
        },
        logIn : function() {
            this.token = prompt("Please enter your token", "-orsGMSc789m-Jk_97jivA");
            $.cookie('token', this.token);
            this.updateLoginUi();
        },
        updateLoginUi : function() {
            var that = this;
            $.getJSON(this.serverUrlWithToken() + "mystats?callback=?", function(response) {
                if (response.error) {
                    alert("Unable to Sign In: " + response.error);
                    that.header.find("#menuLogIn").text("Sign In");
                    return;
                }
                that.name = response.name;
                that.header.find("#menuLogIn").text("Sign out " + that.name);
                that.body.empty();
            });
        },
        listMyCurrentGames : function() {
            this.listGames(this.serverUrlWithToken() + "game/listongoing");
            alert("Join button not implemented");
        },
        listReadyGames : function() {
            this.listGames(this.serverUrlWithToken() + "game/listready");
            alert("Join button not implemented");
        },
        bindEvents : function() {
            var that = this;
            $("#menuCreateGame").click(function() {
                that.createGame();
            });
            $("#menuListOpenGames").click(function() {
                that.listOpenGames();
            });
            $("#menuListAllGames").click(function() {
                that.listAllGames();
            });
            $("#menuListCurrentGames").click(function() {
                that.listMyCurrentGames();
            });
            $("#menuListReadyGames").click(function() {
                that.listReadyGames();
            });
            $("#menuLogIn").click(function() {
                that.logIn();
            });
            this.body.on('click', '.game button', function() {
                that.joinGame(this.value);
            });
            this.body.on('click', 'button.showMyGame', function() {
                var url = that.serverUrlWithToken() + "game/" + this.value + "/show";
                window.open(url, '_blank');
            });
            this.body.on('click', 'button.playGame', function() {
                that.currentGameId = this.value;
                that.playGame();
            });
            this.body.on('click', 'button.startShooting', function() {
                that.currentGameId = this.value;
                that.startShooting();
            });
        },
        updateActiveGameStatus : function(callback) {
            var that = this;
            $.getJSON(this.serverUrlWithToken() + "game/" + that.currentGameId + "/?callback=?", function(response) {
                if (response.error) {
                    alert("Unable to update info about the active game" + response.error);
                } else {
                    that.currentGame = response;
                    that.body.append("<p>" + JSON.stringify(response) + "</p>");
                    callback();
                }
            });
        },
        setShips : function(callback) {
            var that = this;
            // SET SHIPS RANDOMLY
            that.body.append("<p>SETTING SHIPS... WAIT</p>");
            $.getJSON(this.serverUrlWithToken() + "game/" + that.currentGameId + "/randomize?callback=?", function(response) {
                if (response.error) {
                    alert("Unable to update info about the active game" + response.error);
                } else {
                    that.currentGame = response;
                    that.body.append("<p>" + JSON.stringify(response) + "</p>");
                    that.body.append("<button class='showMyGame' value='" + that.currentGameId + "'>SHOW MY BOARD</button>");
                    callback();
                }
            });
        },
        playGame : function() {
            this.body.empty().append('<p>Loading...</p>');
            var that = this;
            that.body.empty();
            that.updateActiveGameStatus(function() {
                that.setShips(function() {
                    that.body.append("<p>MAKE SURE THE SECOND PLAYER HAS JOINED THE GAME BEFORE YOU START SHOOTING</p><button class='startShooting' value='" + that.currentGameId + "'>START SHOOTING</button>");
                });
            });
        },

        startShooting : function() {

            /* TODO: implement your algorithm here

             var enterprise = [[{
             "x" : 6,
             "y" : 0
             }, {
             "x" : 7,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 4,
             "y" : 1
             }, {
             "x" : 6,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 6,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 3
             }, {
             "x" : 4,
             "y" : 3
             }, {
             "x" : 5,
             "y" : 3
             }, {
             "x" : 6,
             "y" : 3
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 4,
             "y" : 1
             }, {
             "x" : 5,
             "y" : 1
             }, {
             "x" : 6,
             "y" : 1
             }, {
             "x" : 7,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 3
             }, {
             "x" : 2,
             "y" : 3
             }, {
             "x" : 3,
             "y" : 3
             }, {
             "x" : 4,
             "y" : 3
             }]];
             var chess = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 4,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 3
             }, {
             "x" : 3,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }, {
             "x" : 2,
             "y" : 4
             }, {
             "x" : 4,
             "y" : 4
             }]];
             var s3 = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 3
             }, {
             "x" : 4,
             "y" : 3
             }, {
             "x" : 4,
             "y" : 4
             }], [{
             "x" : 4,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 4,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 3,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }]];
             var kursk = [[{
             "x" : 3,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 4,
             "y" : 1
             }, {
             "x" : 5,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }], [{
             "x" : 2,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 4,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }, {
             "x" : 5,
             "y" : 2
             }]];
             var crab = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 3,
             "y" : 0
             }, {
             "x" : 4,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 3
             }, {
             "x" : 2,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }, {
             "x" : 3,
             "y" : 4
             }, {
             "x" : 4,
             "y" : 4
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 4,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 3
             }, {
             "x" : 3,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }, {
             "x" : 1,
             "y" : 4
             }, {
             "x" : 4,
             "y" : 4
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 4,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 4,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }, {
             "x" : 4,
             "y" : 4
             }]];
             var death_star = [[{
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 3
             }, {
             "x" : 2,
             "y" : 3
             }]];
             var worm = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 4,
             "y" : 2
             }, {
             "x" : 5,
             "y" : 2
             }, {
             "x" : 5,
             "y" : 1
             }, {
             "x" : 6,
             "y" : 1
             }, {
             "x" : 6,
             "y" : 2
             }]];
             var a = [[{
             "x" : 1,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 2,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }, {
             "x" : 2,
             "y" : 4
             }]];
             var uBoot = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 3
             }, {
             "x" : 2,
             "y" : 3
             }, {
             "x" : 3,
             "y" : 2
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 0
             }]];
             var o = [[{
             "x" : 1,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 2,
             "y" : 3
             }, {
             "x" : 1,
             "y" : 4
             }]];
             var tie_fighter = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 2,
             "y" : 2
             }]];
             var l = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }, {
             "x" : 1,
             "y" : 4
             }, {
             "x" : 2,
             "y" : 4
             }]];
             var s1 = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 1
             }, {
             "x" : 3,
             "y" : 1
             }, {
             "x" : 4,
             "y" : 1
             }], [{
             "x" : 1,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 1,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }]];
             var carrier = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }, {
             "x" : 0,
             "y" : 4
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 3,
             "y" : 0
             }, {
             "x" : 4,
             "y" : 0
             }]];
             var battleship = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }, {
             "x" : 0,
             "y" : 3
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }, {
             "x" : 3,
             "y" : 0
             }]];
             var submarine = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }]];
             var cruiser = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }, {
             "x" : 0,
             "y" : 2
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }, {
             "x" : 2,
             "y" : 0
             }]];
             var patrol = [[{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 0,
             "y" : 1
             }], [{
             "x" : 0,
             "y" : 0
             }, {
             "x" : 1,
             "y" : 0
             }]];*/

            this.nextShootX = -1;
            this.nextShootY = -1;
            var that = this;
            this.body.append("<p>" + "Shooting to board " + JSON.stringify(this.currentGame.id) + " DONE</p>");
            this.body.find("button.startShooting").remove();
            this.determineNextShootXY(function() {
                that.shootRequest(that.nextShootX, that.nextShootY);
            });
        },

        determineNextShootXY : function(callback) {
            if (this.nextShootX + 1 < this.currentGame.width) {
                this.nextShootX=this.nextShootX+1;
                callback();
            } else if (this.nextShootY + 1 < this.currentGame.height) {
                this.nextShootX = 0;
                this.nextShootY=this.nextShootY+1;
                callback();
            } else {
                alert('end of shooting');
            }
        },
        shootRequest : function(x, y) {
            var that = this;
            var url = this.shootUrl(x, y) + "&callback=?";
     

            $.ajax({
                url : url,
                dataType : 'jsonp',
                async : false,
                success : function(data) {
                    //console.log("Status " + data.ship_status);
                    //console.log("X " + data.x);
                    //console.log("Y " + data.y);
                    if (data.ship_status == "sunk"){
                        that.nextShootX = data.x + 1;
                    } else {
                        if (data.ship_status == "hit"){
                            if (data.ship_type == "chess"){
                                //console.log("This is a Chess");
                                that.nextShootX = data.x + 1;
                            }

                            if (data.ship_type == "kursk"){
                                if (kurskV == 0) { 
                                //console.log("This is a Chess");
                                    that.nextShootX = data.x + 3;
                                    kurskV = kurskV + 1;
                                }
                            }


                            if (data.ship_type == "o"){
                                //console.log("This is a O");
                                that.nextShootX = data.x + 1;
                            }                       
                            if (data.ship_type == "l"){
                                //console.log("This is a L");
                                countL = countL + 1;
                                console.log("Count L" + countL);
                                if(countL <= 4){
                                    that.nextShootX = data.x + 1;
                                }
                            } 
                            if (data.ship_type == "uBoot"){
                                countuB = countuB + 1;
                                if(countuB < 7){
                                    that.nextShootX = data.x + 1;
                                }     
                            }    
                        }
                    };

                    that.determineNextShootXY(function() {
                        that.shootRequest(that.nextShootX, that.nextShootY);
                    });
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    console.error("Something is wrong");
                    console.error(textStatus + " - " + errorThrown);
                }
            });
        },
        init : function() {
            this.bindEvents();
            this.updateLoginUi();
        }
    };
    CLIENT.init();
});
