Game = {
    addEvent: function (obj, type, fn) { obj.addEventListener(type, fn, false); },
    
    createCanvas: function() {
        return document.createElement("canvas");
    },
    
    compatible: function() {
        return Object.create &&
            Object.extend &&
            Function.bind &&
            document.addEventListener && 
            // HTML5 standard, all modern browsers that support canvas should also support add/removeEventListener
            Game.ua.hasCanvas
    },
    
    onErrorLoadingImages: function() {
        throw new Error("Error loading images. Exitting.");
    },
    
    loadImages: function(imgs, callback) {
        console.log("Game :: loadImages", imgs);
        // load multiple images and callback when they're all ready
        var images = {};
        var count = imgs ? imgs.length : 0;
        if (count == 0) {
            calback(images);
        } else {
            var timeout = setTimeout(this.onErrorLoadingImages, 5000);
            for (var i=0; i < imgs.length; i++) {
                var source = imgs[i];
                var image = document.createElement("img");
                images[source] = image;
                Game.addEvent(image, "load", function() {
                    console.log("loaded image", count + ":", this);
                    if (--count == 0) {
                        callback(images);
                        clearTimeout(timeout);
                    }
                });
                image.src = source;
            }
        }
    },
    
    random: function(min, max) {
        return (min + (Math.random() * (max - min)));
    },

    randomChoice: function() {
        return arguments[Math.floor(this.random(0, arguments.length))];
    },
    
    randomInt: function(min, max) {
        return Math.round(this.random(min, max));
    },
    
    ready: function(fn) {
        if (this.compatible()) {
            console.log("Game analyzing " + this.ua.full);
            this.addEvent(document, "DOMContentLoaded", fn);
        }
    },
    
    start: function(id, game, cfg) {
        if (this.compatible()) {
            return Object.construct(this.Runner, id, game, cfg).game; 
            // return the game instance, not the runner.
            // Caller can always get at the runner via game.runner
        }
    },    
    
    timestamp: function() {
        return new Date().getTime();
    },
    
    ua: function() {
        return {
            full:       navigator.userAgent.toLowerCase(),
            hasCanvas:  document.createElement("canvas").getContext,
            hasAudio:   typeof Audio != "undefined",
            hasAnimation: !!(window.webkitRequestAnimationFrame || 
                         window.mozRequestAnimationFrame    || 
                         window.oRequestAnimationFrame      || 
                         window.msRequestAnimationFrame)
        };
    }(),
    
    KEY: {
        BACKSPACE: 8,
        TAB:       9,
        RETURN:   13,
        ESC:      27,
        SPACE:    32,
        LEFT:     37,
        UP:       38,
        RIGHT:    39,
        DOWN:     40,
        DELETE:   46,
        HOME:     36,
        END:      35,
        PAGEUP:   33,
        PAGEDOWN: 34,
        INSERT:   45,
        ZERO:     48,
        ONE:      49,
        TWO:      50,
        A:        65,
        L:        76,
        P:        80,
        Q:        81,
        TILDA:    192
    },
    
    Runner: {
        initialize: function(id, game, cfg) {
            this.cfg          = Object.extend(game.Defaults || {}, cfg || {}); 
            // use game defaults (if any) and extend with custom cfg (if any)
            this.fps          = this.cfg.fps || 60;
            this.interval     = 1000.0 / this.fps;
            this.canvas       = document.getElementById(id);
            this.width        = this.cfg.width  || this.canvas.offsetWidth;
            this.height       = this.cfg.height || this.canvas.offsetHeight;
            this.front        = this.canvas;
            this.front.width  = this.width;
            this.front.height = this.height;
            this.back         = Game.createCanvas();
            this.back.width   = this.width;
            this.back.height  = this.height;
            this.front2d      = this.front.getContext('2d');
            this.back2d       = this.back.getContext('2d');
            
            this.isRunning    = false;
            
            this.addEvents();
            this.resetStats();

            if (game.update && game.draw) {
                this.game = Object.construct(game, this, this.cfg); 
            } else {
                throw new Error("Game object incorrectly created");
            }
            // finally construct the game object itself
        },
        
        addEvents: function() {
            console.log("Runner :: addEvents");
            Game.addEvent(document, "keyup", this.onkeyup.bind(this));
            Game.addEvent(document, "keydown", this.onkeydown.bind(this));
            
            // mouse events
            Game.addEvent(document, "mousemove", this.onmousemove.bind(this));
            Game.addEvent(document, "mousedown", this.onmousedown.bind(this));
        },
        
        alert: function(msg) {
            this.stop(); 
            // alert blocks thread, so need to stop game loop in order to avoid sending huge dt values to next update
            result = window.alert(msg);
            this.start();
            return result;
        },

        confirm: function(msg) {
            this.stop(); 
            // alert blocks thread, so need to stop game loop in order to avoid sending huge dt values to next update
            result = window.confirm(msg);
            this.start();
            return result;
        },
        
        draw: function() {
            this.back2d.clearRect(0, 0, this.width, this.height);
            this.game.draw(this.back2d);
            this.drawStats(this.back2d);
            
            this.front2d.clearRect(0, 0, this.width, this.height);
            this.front2d.drawImage(this.back, 0, 0);
        },
        
        drawStats: function(ctx) {
            if (!this.cfg.noStats) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
                ctx.fillRect(this.width - 120, this.height - 90, 105, 90);
                ctx.fillStyle = 'white';
                ctx.font = '9pt sans-serif';
                ctx.fillText("frame: "  + this.stats.count,         this.width - 100, this.height - 75);
                ctx.fillText("fps: "    + this.stats.fps,           this.width - 100, this.height - 60);
                ctx.fillText("update: " + this.stats.update + "ms", this.width - 100, this.height - 45);
                ctx.fillText("draw: "   + this.stats.draw   + "ms", this.width - 100, this.height - 30);
            }
        },
        
        getCursorPosition: function(ev) {
            var x, y;
            if (ev.pageX || ev.pageY) {
                x = ev.pageX;
                y = ev.pageY;
            } else {
                x = event.clientX + document.body.scrollLeft + document.documentElement. scrollLeft;
                y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            
            x -= this.canvas.offsetLeft;
            y -= this.canvas.offsetTop;
            
            return {x: x, y: y};
        },
        
        hideCursor: function() { this.canvas.style.cursor = 'none'; },
        
        loop: function() {
            var start  = Game.timestamp(); 
            
            this.update((start - this.lastFrame) / 1000.0); // send dt as seconds
            
            var middle = Game.timestamp(); 
            
            this.draw();
            
            var end    = Game.timestamp();
            if (!this.cfg.noStats) {
                this.updateStats(middle - start, end - middle);
            }
            this.lastFrame = start;
            
            if (Game.ua.hasAnimation && this.isRunning && !this.cfg.forceInterval ) {
                this.timer     = requestAnimationFrame(this.loop.bind(this));
            }
        },
        
        onkeyup: function(ev) {
            if (this.game.onkeyup) {
                this.game.onkeyup(ev.keyCode);
            }
        },
        onkeydown: function(ev) {
            if (this.game.onkeydown) {
                this.game.onkeydown(ev.keyCode);
            }
        },
        
        onmousemove: function(ev) {
            var mousePos = this.getCursorPosition(ev);
            
            if (this.game.onmousemove) {
                this.game.onmousemove(mousePos, ev);
            }
        },
        
        onmousedown: function(ev) {
            var mousePos = this.getCursorPosition(ev);
            
            if (this.game.onmousedown) {
                this.game.onmousedown(mousePos, ev);
            }
        },
        
        resetStats: function() {
            console.log("Runner :: resetStats");
            this.stats = {
                count:  0,
                fps:    0,
                update: 0,
                draw:   0, 
                frame:  0  // update + draw
            };
        },
        
        start: function() {
            // game instance calls runner.start() when its finished initializing and is ready to start the game loop
            console.log("Runner :: start");
            this.lastFrame = Game.timestamp();
            this.isRunning = true;
            if (Game.ua.hasAnimation && !this.cfg.forceInterval) {
                this.timer     = requestAnimationFrame(this.loop.bind(this));
            } else {
                this.timer = setInterval(this.loop.bind(this), this.interval);
            }
        },
        
        showCursor: function() { this.canvas.style.cursor = 'auto'; },
        
        stop: function() {
            this.isRunning = false;
            if (Game.ua.hasAnimation && !this.cfg.forceInterval) {
                cancelAnimationFrame(this.timer);
            } else {
                clearInterval(this.timer);
            }
        },
        
        update: function(dt) {
            this.game.update(dt);
        },
        
        updateStats: function(update, draw) {
            if (!this.cfg.noStats) {
                this.stats.update = Math.max(1, update);
                this.stats.draw   = Math.max(1, draw);
                this.stats.frame  = this.stats.update + this.stats.draw;
                this.stats.count  = this.stats.count == this.fps ? 0 : this.stats.count + 1;
                this.stats.fps    = Math.min(this.fps, 1000 / this.stats.frame);
            }
        }
    }
}; /*Game*/