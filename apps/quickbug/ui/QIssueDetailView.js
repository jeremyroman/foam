MODEL({
  name: 'QIssueDetailView',
  extendsModel: 'DetailView',

  properties: [
    {
      name: 'model',
      factory: function() { return this.__ctx__.QIssue; }
    },
    {
      model_: 'BooleanProperty',
      name: 'saveEnabled',
      defaultValue: false
    },
    {
      model_: 'DAOProperty',
      name: 'issueDAO'
    },
    {
      model_: 'DAOProperty',
      name: 'cursorIssueDAO'
    },
    {
      name: 'url'
    },
    {
      name: 'cursorView',
      factory: function() {
        return this.__ctx__.CursorView.create({
          data: this.__ctx__.Cursor.create({dao: this.cursorIssueDAO$Proxy})});
      }
    },
    {
      name: 'blockingView',
      factory: function() {
        return this.__ctx__.BlockView.create({
          property: this.__ctx__.QIssue.BLOCKING,
          ids: this.data.blocking});
      }
    },
    {
      name: 'blockedOnView',
      factory: function() {
        return this.__ctx__.BlockView.create({
          property: this.__ctx__.QIssue.BLOCKED_ON,
          ids: this.data.blockedOn});
      }
    },
    'newCommentView'
  ],

  listeners: [
    {
      name: 'doSave',
      code: function() {
        // Don't keep listening if we're no longer around.
        if ( ! this.$ ) throw EventService.UNSUBSCRIBE_EXCEPTION;

        if ( this.saveEnabled ) this.issueDAO.put(this.data);
      }
    }
  ],

  methods: {
    destroy: function() {
      this.SUPER();
      if ( this.data ) this.data.removeListener(this.doSave);
    },
    commentCreateView: function() {
      return this.newCommentView = this.__ctx__.QIssueCommentCreateView.create({
        dao: this.data.comments,
        issue$: this.data$,
        data: this.data.newComment()
      });
    },
    clView: function() {
      return this.__ctx__.QIssueCLView.create({dao: this.data.comments});
    },
    toHTML: function() {
      return '<div id="' + this.id + '">' + this.toInnerHTML() + '</div>';
    },
    updateSubViews: function() {
      this.SUPER();
      this.newCommentView.data = this.data.newComment();
      this.saveEnabled = true;
    },
    refresh: function() {
      var self = this;
      self.issueDAO.where(EQ(this.__ctx__.QIssue.ID, self.data.id)).listen(
        EventService.oneTime(function() {
          self.issueDAO.find(self.data.id, {
            put: function(issue) {
              self.data = issue;
              self.newCommentView.issue
            }
          });
        })
      );
    },
  },

  templates: [
    { name: 'toInnerHTML' }
  ]
});


MODEL({
  name: 'QIssueLabelsView',
  extendsModel: 'View',

  properties: [
    {
      name: 'data',
      factory: function() { return SimpleValue.create([]); },
      postSet: function() { this.update(); }
    }
  ],

  methods: {
    toHTML: function() { return '<div id="' + this.id + '"></div>'; },
    initHTML: function() { this.SUPER(); this.update(); }
  },

  listeners: [
    {
      name: 'update',
      isFramed: true,
      code: function() {
        if ( ! this.$ ) return;

        var value = this.data.sort(function (o1, o2) {
          return o1.toLowerCase().compareTo(o2.toLowerCase());
        });
        var out = "";
        for ( var i = 0; i < value.length; i++ ) {
          var start = value[i].substring(0, value[i].indexOf('-') + 1);
          var rest  = value[i].substring(value[i].indexOf('-') + 1);

          if ( start != 'Restrict-' ) {
            out += '<div><b>' +
              this.strToHTML(start) + '</b>' +
              this.strToHTML(rest) + '</div>';
          }
        }
        this.$.innerHTML = out;
      }
    }
  ]
});
