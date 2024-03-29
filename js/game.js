!function($, Crafty, App){


    var channel = 'A-game';

    var players = (function(){
        var players_obj = {};
        return {
            add : function(player) {
                players_obj[player['uuid']] = player;
                return player;
            },
            get : function(uuid) {
                return players_obj[uuid];
            },
            all : function() {
                return players_obj;
            }
        };
    })();

    function current_player(ready) {
        function is_ready() {
            if (player['uuid'] && player['joined']) {
                players.add(player);
                ready(player)
            }
        }

        var player = {
            'uuid' : PUBNUB.uuid(function(uuid){
                player['uuid'] = uuid;
                is_ready();
            }),
            'joined' : PUBNUB.time(function(time){
                player['joined'] = time;
                is_ready();
            })
        };
    };

    var player = {
        'players' : players,
        'current_player' : current_player
    };

    App.current_player = { ready : 0 };
    var manPos = {};
    var thePlayers = {};

    // Create New Player
    player.current_player(function(self){
        App.current_player.info = self;
        App.current_player.ready = 1;

        // Call Ready Function
        game_ready();
    });

    App.sendMessage = function(message) {
        PUBNUB.publish({
            'channel' : channel,
            'message' : message
        });
    }   
    function add_player(message) {
        var uuid = message.info['uuid']
        , self = false;
        

        var setup = '2D, DOM, Ape, player, KeyReceiver';
        if (self = (uuid == App.current_player.info.uuid)) {
            setup += ', KeySender';
        }
        if(message.x != undefined && message.y != undefined) {
            manPos.x = message.x;
            manPos.y = message.y;
        }
        var player1 = Crafty.e(setup)
                 .attr(manPos);
  
        if (self) {
            player1.sender(1, {
                UP_ARROW: -90,
                RIGHT_ARROW: 0,
                LEFT_ARROW: 180,DOWN_ARROW: 90,
                W: -90,
                D: 0,
                A: 180,
                Q: 180
            });
        }
        
        player1.receiver(1, {
                UP_ARROW: -90,
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,DOWN_ARROW: 90,
            D: 0,
            A: 180,
            Q: 180
        }, 6);

        if (!players.get(uuid)) {
            var player = message['info'];
            players.add(player);
        } 

        thePlayers[uuid] = player1;
    }

    function move_player(message) {
        var uuid = message.info['uuid'];
        //New movement? Add the player...needs work is broken..
        if (!players.get(uuid)) {
            add_player(message);
        }
        switch (message['action']) {
            case 'player_keydown' :
                thePlayers[uuid].trigger("KeyDownReceive", message.key);
                break;
            case 'player_keyup' :
                thePlayers[uuid].trigger("KeyUpReceive", message.key);
                break;
        }
    }

    function game_ready() {

        PUBNUB.subscribe( { 
            'channel' : channel,
            callback   : function(message) {

                switch (message['action']) {
                    case 'player_arrive' :
                        add_player(message);
                        break;
                    case 'player_keydown' :
                        move_player(message);
                        break;
                    case 'player_keyup' :
                        move_player(message);
                        break;
                }
            },
            connect : function() {        // CONNECTION ESTABLISHED.
                App.sendMessage({
                    'action' : 'player_arrive',
                    'info' : App.current_player.info
                })
 
            }
         });
        
    };
    //method to randomy generate the map
	function generateWorld() {
		//generate the grass along the x-axis
		for(var i = 0; i < 25; i++) {
			//generate the grass along the y-axis
			for(var j = 0; j < 20; j++) {
				grassType = Crafty.math.randomInt(1, 4);
				Crafty.e("2D, Canvas, grass"+grassType)
					.attr({x: i * 32, y: j * 32});
				
				//1/50 chance of drawing a flower and only within the bushes
				if(i > 0 && i < 24 && j > 0 && j < 19 && Crafty.math.randomInt(0, 3) > 2) {
					Crafty.e("2D, DOM, bush2, solid")
						.attr({x: i * 32, y: j * 32})
                                                .bind('explode', function() {
                                                    this.destroy();
                                                });
				}
                                
                                if((i % 2 === 0) && (j % 2 === 0)) {
                                   Crafty.e("2D, DOM, solid, bush1")
                                       .attr({x: i * 32, y: j * 32, z: 2000})
                               }
			}
		}
		
		//create the bushes along the x-axis which will form the boundaries
		for(var i = 0; i < 25; i++) {
			Crafty.e("2D, Canvas, wall_top, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: i * 32, y: 0, z: 2});
			Crafty.e("2D, DOM, wall_bottom, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: i * 32, y: 608, z: 2});
		}
		
		//create the bushes along the y-axis
		//we need to start one more and one less to not overlap the previous bushes
		for(var i = 1; i < 19; i++) {
			Crafty.e("2D, DOM, wall_left, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: 0, y: i * 32, z: 2});
			Crafty.e("2D, Canvas, wall_right, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: 768, y: i * 32, z: 2});
		}
	}

    $(function(){
        var documentHeight = $(document).height();
        var documentWidth = $(document).width();
        
        Crafty.init(documentWidth, documentHeight);

        Crafty.scene("main", function () {

		generateWorld();
            $('.row .well').each(function(i){
                var $this = $(this);
                var pos = $this.offset();
                var height = $this.outerHeight();
                var width = $this.outerWidth();
                var attrs = {w: width-8, h: height, x: pos['left']+4, y: pos["top"]};
                if (i == 1){
                    manPos = {x: pos['left']+16, y: pos["top"]-16, z:1}
                }
                Crafty.e('platform').attr(attrs);
            });

            Crafty.e('Color, platform').attr({w: documentWidth, h: 1, x: 0, y: documentHeight}).color('#000000');
            
        });

        Crafty.scene("main");

    });
}(window.jQuery, window.Crafty, window.APP || (window.APP = {}));