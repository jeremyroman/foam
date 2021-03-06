MODEL({
  name: 'Ball',
  extendsModel: 'Circle2',
  traits: ['Physical', 'MotionBlur'],
  properties: [
    {
      name: 'vx',
      preSet: function(_, v) { return Math.sign(v) * Math.max(5, Math.abs(v)); }
    }
  ]
});


MODEL({
  name: 'Paddle',
  extendsModel: 'Circle2',
  traits: ['Physical', 'Shadow'],
  properties: [
    { name: 'color', defaultValue: 'white' },
    { name: 'r',     defaultValue: 30 },
    { name: 'mass',  defaultValue: Physical.getPrototype().INFINITE_MASS },
  ]
});


MODEL({
  name: 'Pong',

  properties: [
    {
      name: 'WIDTH',
      defaultValue: 800
    },
    {
      name: 'HEIGHT',
      defaultValue: 300
    },
    {
      name: 'table',
      factory: function() {
        return CView2.create({background: 'lightgray', width: this.WIDTH, height: this.HEIGHT});
      }
    },
    {
      name: 'ball',
      factory: function() { return Ball.create({color: 'white', r: 20}); }
    },
    {
      name: 'lPaddle',
      factory: function() { return Paddle.create(); }
    },
    {
      name: 'rPaddle',
      factory: function() { return Paddle.create(); }
    },
    {
      model_: 'IntProperty',
      name: 'lScore',
      postSet: function(_, s) { return s % 100; }
    },
    {
      model_: 'IntProperty',
      name: 'rScore',
      postSet: function(_, s) { return s % 100; }
    }
  ],

  listeners: [
    {
      name: 'onBallMove',
      isFramed: true,
      code: function() {
        if ( this.ball.y - this.ball.r <= 0 ) {
          this.ball.vy = Math.abs(this.ball.vy);
        }
        if ( this.ball.y + this.ball.r >= this.HEIGHT ) {
          this.ball.vy = -Math.abs(this.ball.vy);
        }
        if ( this.ball.x <= 0 ) {
          this.rScore++;
          this.ball.x = 150;
          this.ball.vx *= -1;
        }
        if ( this.ball.x >= this.WIDTH ) {
          this.lScore++;
          this.ball.x = this.WIDTH - 150;
          this.ball.vx *= -1;
        }
      }
    }
  ],

  actions: [
    {
      name: 'lUp',
      keyboardShortcuts: [ 81 /* q */ ],
      action: function() { this.lPaddle.y -= 10; }
    },
    {
      name: 'lDown',
      keyboardShortcuts: [ 65 /* a */ ],
      action: function() { this.lPaddle.y += 10; }
    },
    {
      name: 'rUp',
      keyboardShortcuts: [ 38 /* up arrow */ ],
      action: function() { this.rPaddle.y -= 10; }
    },
    {
      name: 'rDown',
      keyboardShortcuts: [ 40 /* down arrow */ ],
      action: function() { this.rPaddle.y += 10; }
    }
  ],

  templates: [
    function toDetailHTML() {/*
      <div id="%%id">$$lScore{mode: 'read-only'} $$rScore{mode: 'read-only'} <br> %%data.table</div>
    */}
  ],

  methods: {
    toHTML: function() {
      this.view = DetailView.create({data: this});
      return this.view.toHTML();
    },
    initHTML: function() {
      this.view.initHTML();
      this.lPaddle.x = 25+this.lPaddle.r;
      this.rPaddle.x = this.WIDTH-25-this.rPaddle.r;
      this.lPaddle.y = this.rPaddle.y = (this.HEIGHT-this.rPaddle.height)/2;

      Movement.inertia(this.ball);

      this.ball.x  = this.ball.y  = 100;
      this.ball.y  = this.rPaddle.y;
      this.ball.vx = this.ball.vy = 10;

      this.table.addChildren(
        CView2.create({x: this.WIDTH/2-5, width:10, height: this.HEIGHT, background: 'white'}),
        this.ball,
        this.lPaddle,
        this.rPaddle);

      this.ball.x$.addListener(this.onBallMove);

      var collider = Collider.create({pong: this});
      collider.add(this.ball, this.lPaddle, this.rPaddle);
      collider.start();

      this.table.paint();
    }
  }
});
