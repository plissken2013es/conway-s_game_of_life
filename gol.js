Conway = {
    Defaults: {
        width: 500,
        height: 500,
        noStats: true
    },
    
    Presets: {
        GOSPER_GLIDER_GUN: [
            [1, 5],[1, 6],[2, 5],[2, 6],[11, 5],[11, 6],[11, 7],[12, 4],[12, 8],[13, 3],[13, 9],[14, 3],[14, 9],[15, 6],[16, 4],[16, 8],[17, 5],[17, 6],[17, 7],[18, 6],[21, 3],[21, 4],[21, 5],[22, 3],[22, 4],[22, 5],[23, 2],[23, 6],[25, 1],[25, 2],[25, 6],[25, 7],[35, 3],[35, 4],[36, 3],[36, 4]
        ],
        R_PENTOMINO: [[29, 12], [30, 12], [28, 13], [29, 13], [29, 14]],
        SIMPLE_GLIDER: [[35, 17], [33, 18], [35, 18], [34, 19], [35, 19]],
        SPACESHIP: [[45, 15], [30, 16], [44, 16], [45, 16], [30, 17], [43, 17], [44, 17], [30, 18], [44, 18], [45, 18], [45, 19]],
        QUEEN_B_SHUTTLE: [[26, 13], [24, 14], [26, 14], [23, 15], [25, 15], [17, 16], [18, 16], [22, 16], [25, 16], [17, 17], [18, 17], [23, 17], [25, 17], [24, 18], [26, 18], [35, 18], [36, 18], [26, 19], [35, 19], [37, 19], [37, 20], [37, 21], [38, 21]],
        THUNDERBIRD: [[22, 13], [23, 13], [24, 13], [23, 15], [23, 16], [23, 17]]
    },
    
    Buttons: { 
        GOSPER_GLIDER_GUN: ["Gosper Glider", this.gosperGliderBtn],
        R_PENTOMINO: ["R-pentomino", this.RpentominoBtn],
        SIMPLE_GLIDER: ["Simple Glider", this.gliderBtn],
        SPACESHIP: ["17c/45-Spaceship", this.Rpentomino],
        QUEEN_B_SHUTTLE: ["Queen B Shuttle", this.queenBShuttleBtn],
        THUNDERBIRD: ["Thunderbird", this.thunderbirdBtn]
    },
    
    initialize: function(runner, cfg) {
        this.runner = runner;
        this.cfg = cfg;
        
        this.CELL_SIZE = this.cfg.CELL_SIZE || 10;
        this.X = this.cfg.width || 570;
        this.Y = this.cfg.height || 320;
        this.WIDTH = this.X / this.CELL_SIZE;
        this.HEIGHT = this.Y / this.CELL_SIZE;
        
        this.DEAD       = 0;
        this.ALIVE      = 1;
        this.STOPPED    = 0;
        this.RUNNING    = 1;
        this.STEPPING   = 2;
        
        this.minimum    = this.cfg.minimum || 2;
        this.maximum    = this.cfg.maximum || 3;
        this.spawn      = this.cfg.spawn || 3;
        
        this.state      = this.STOPPED;
        
        this.grid       = Array.matrix(this.HEIGHT, this.WIDTH, 0);
        this.counter    = 0;
        
        this.background = Game.createCanvas();
        this.background.width = this.X;
        this.background.height = this.Y;
        this.drawBackground(this.background.getContext("2d"));
        
        this.createControls();
        this.addEventsToControls();
        
        this.mousePos;
        
        this.runner.start();
    },
    
    draw: function(ctx) {
        ctx.drawImage(this.background, 0, 0);        
        this.drawCells(ctx);
        this.iterations.innerHTML = this.counter;
    },
    update: function(dt) {
        if (this.state == this.RUNNING || this.state == this.STEPPING) {
            this.updateState();
            
            if (this.state == this.STEPPING) {
                this.state = this.STOPPED;
            }
        }
    },
    
    addEventsToControls: function() {
        this.startStopBtn.onclick = (function() {
            switch (this.state) {
                case this.STOPPED:
                    this.state = this.RUNNING;
                    break;
                    
                default:
                    this.state = this.STOPPED;
                    break;
            }
        }).bind(this);
        
        this.stepBtn.onclick = (function() {
            this.state = this.STEPPING;
        }).bind(this);
        
        this.clearBtn.onclick = (function() {
            this.state = this.STOPPED;
            this.counter = 0;
            this.grid = Array.matrix(this.HEIGHT, this.WIDTH, 0);
        }).bind(this);
        
        for (var preset in this.Presets) {
            this.Buttons[preset][1].onclick = (function(pst) {
                this.setPreset(pst) 
            }).bind(this, this.Presets[preset]); 
        }
    },
    
    copyGrid: function(source, destination) {
        for (var h=0; h < this.HEIGHT; h++) {
            destination[h] = source[h].slice(0);
        }
    },
    
    createControls: function() {
        // iterations counter
        this.iterations = document.createElement("div");
        this.iterations.innerHTML = 0;
        
        // button controls
        var controlDiv = document.createElement("div");
        this.startStopBtn = document.createElement("button");
        this.startStopBtn.innerHTML = "Start / Stop";
        this.stepBtn = document.createElement("button");
        this.stepBtn.innerHTML = "Single Step";
        this.clearBtn = document.createElement("button");
        this.clearBtn.innerHTML = "Clear";
        controlDiv.appendChild(this.startStopBtn);
        controlDiv.appendChild(this.stepBtn);
        controlDiv.appendChild(this.clearBtn);
        
        // button for presets
        var presetDiv = document.createElement("div");
        for (var preset in this.Presets) {
            this.Buttons[preset][1] = document.createElement("button");
            this.Buttons[preset][1].innerHTML = this.Buttons[preset][0];
            presetDiv.appendChild(this.Buttons[preset][1]);
        }
        
        document.body.appendChild(this.iterations);
        document.body.appendChild(controlDiv);
        document.body.appendChild(presetDiv);
    },
    
    drawBackground: function(ctx) {
        ctx.strokeStyle = "#ccc";
        for (var x=0; x<=this.X; x+= this.CELL_SIZE) {
            ctx.moveTo(0.0 + x, 0);
            ctx.lineTo(0.0 + x, this.Y);
        }
        for (var y=0; y<=this.Y; y+=this.CELL_SIZE) {
            ctx.moveTo(0, 0.0 + y);
            ctx.lineTo(this.X, 0.0 + y);
        }
        ctx.stroke();
    },
    
    drawCells: function(ctx) {
        for (var h=0; h<this.HEIGHT; h++) {
            for (var w=0; w<this.WIDTH; w++) {
                if (this.grid[h][w] === this.ALIVE) {
                    ctx.fillStyle = "#262626";
                } else {
                    ctx.fillStyle = "#fff";
                }
                ctx.fillRect(
                    w * this.CELL_SIZE + 1,
                    h * this.CELL_SIZE + 1,
                    this.CELL_SIZE - 1,
                    this.CELL_SIZE - 1
                );
            }
        }
    },
    
    onmousemove: function(pos, ev) {
        this.mousePos = {x: pos.x, y: pos.y};
    },
    
    onmousedown: function(pos, ev) {
        this.mousePos = {x: pos.x, y: pos.y};
        
        var x = Math.floor(pos.x/this.CELL_SIZE);
        var y = Math.floor(pos.y/this.CELL_SIZE);
        
        try {
            var state = this.grid[y][x] === this.ALIVE ? this.DEAD : this.ALIVE;
            this.grid[y][x] = state;
        } catch(e) {
            // silently fails
        }
    },
    
    setPreset: function(preset) {
        for (var q=0, l=preset.length; q<l; q++) {
            this.grid[preset[q][1]][preset[q][0]] = this.ALIVE;
        }
    },
    
    updateState: function() {
        var neighbours;
        
        var nextGenerationGrid = Array.matrix(this.HEIGHT, this.WIDTH, 0);
        
        for (var h=0; h<this.HEIGHT; h++) {
            for (var w=0; w<this.WIDTH; w++) {
                neighbours = this.calculateNeighbours(h, w);
                if (this.grid[h][w] !== this.DEAD) {
                    if ((neighbours >= this.minimum) && 
                        (neighbours <= this.maximum)) {
                        nextGenerationGrid[h][w] = this.ALIVE;
                    }
                } else {
                    if (neighbours === this.spawn) {
                        nextGenerationGrid[h][w] = this.ALIVE;
                    }
                }
            }
        }
        this.copyGrid(nextGenerationGrid, this.grid);
        this.counter ++;
    },    
        
    calculateNeighbours: function(y, x) {
        var total = (this.grid[y][x] !== this.DEAD) ? -1 : 0;
        // i need a -1 to start from when the cell is alive, because
        // we're gonna add +1 to the total when counting it (w=0, h=0)
        for (var h=-1; h<=1; h++) {
            for (var w=-1; w<=1; w++) {
                if (this.grid[(this.HEIGHT + y + h) % this.HEIGHT][(this.WIDTH + x + w) % this.WIDTH] !== this.DEAD) {
                    total++;
                }
            }
        }
        return total;
    }
};