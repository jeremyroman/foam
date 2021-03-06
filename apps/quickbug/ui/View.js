/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var VersionParser = {
  __proto__: grammar,

  START: repeat(sym('component'), optional(sym('separator'))),

  component: alt(
    sym('number'),
    sym('string')
  ),

  digit: range('0', '9'),

  number: plus(sym('digit')),

  string: str(plus(not(alt(sym('digit'), sym('separator')), anyChar))),

  separator: alt('.', '-')
}.addActions({
  number: function(v) { return parseInt(v.join('')); }
});

function createVersionComparator() {
  var m = {};
  
  function toKey(o) {
    return m[o] || ( m[o] = VersionParser.parseString(o) );
  }

  return function(o1, o2) {
    o1 = toKey(o1);
    o2 = toKey(o2);

    for ( var i = 0 ; ; i++ ) {
      if ( i == o1.length && i == o2.length ) return 0;
      if ( i == o1.length ) return -1;
      if ( i == o2.length ) return  1;
      if ( typeof o1[i] === 'string' && typeof o2[i] !== 'string' ) return  1;
      if ( typeof o1[i] !== 'string' && typeof o2[i] === 'string' ) return -1;
      var c = o2.compareTo(o1);
      if ( c !== 0 ) return c;
    }
  };
};

// Accumulator which formats objects in a column.  Used within GridView
var COL = {
  create: function() { return { __proto__: this, values: [] }; },
  put: function(v) { this.values.push(v); },
  toHTML: function() {
    var s = '';
    var vs = this.values;
    if( vs.length && vs[0].issue ) {
      vs.sort(function(o1, o2) {
        return o1.issue.id.compareTo(o2.issue.id);
      });
    }
    for ( var i = 0 ; i < vs.length ; i++ ) s += vs[i].toHTML ? vs[i].toHTML() : vs[i];
    return s;
  },
  initHTML: function() {
    for ( var i in this.values ) {
      var o = this.values[i];
      o.initHTML && o.initHTML();
    }
  },
  clone: function() { return this.create(); }
};


MODEL({
  name: 'DragAndDropGrid',
  extendsModel: 'GridByExpr',

  properties: [
    {
      name: 'dao'
    }
  ],

  methods: {
    // Milestone and Iteration use the following specialized compator rule:
    //   1. Undefined values come first
    //   2. Next, number values are sorted in descending order
    //   3. Next, string values are sorted in ascending order
    // TODO: this can be moved to the Model now.
    sortAxis: function(values, f) {
      return values.sort(
        f.name === 'milestone' || f.name === 'iteration' ?
          createVersionComparator() :
          f.compareProperty);
    },
    renderCell: function(x, y, data) {
      var cell = this.__ctx__.IssueDropCell.create({
        data: data,
        dao: this.dao,
        props: [this.xFunc, this.yFunc],
        values: [x, y]
      });
      this.children.push(cell);
      return cell.toHTML();
    },
    clone: function() {
      var clone = this.SUPER();
      clone.dao = this.dao;
      return clone;
    }
  }
});


MODEL({
  name: 'IssueDropCell',
  extendsModel: 'View',

  properties: [
    {
      name: 'data'
    },
    {
      name: 'dao',
      hidden: true
    },
    {
      model_: 'ArrayProperty',
      name: 'props'
    },
    {
      model_: 'ArrayProperty',
      name: 'values'
    }
  ],

  methods: {
    toHTML: function() {
      this.on('dragenter', this.onDragEnter, this.id);
      this.on('dragover', this.onDragEnter, this.id);
      this.on('drop', this.onDrop, this.id);
      return '<td id="' + this.id + '">' +
        (this.data ? (this.data.toHTML ? this.data.toHTML() : this.data) : '') + '</td>';
    },
    initHTML: function() {
      this.SUPER();
      this.data && this.data.initHTML && this.data.initHTML();
    },
    put: function(obj) {
      this.data.put(obj);
    }
  },

  listeners: [
    {
      name: 'onDragEnter',
      code: function(e) {
        for ( var i = 0; i < e.dataTransfer.types.length; i++ ) {
          if ( e.dataTransfer.types[i] === 'application/x-foam-id' ) {
            e.dataTransfer.dropEffect = "move";
            e.preventDefault();
            return;
          }
        }
      }
    },
    {
      name: 'onDrop',
      code: function(e) {
        var data = e.dataTransfer.getData('application/x-foam-id');
        if ( ! data ) return;

        e.preventDefault();

        var props = this.props;
        var values = this.values;
        var dao = this.dao;
        dao.find(data, {
          put: function(obj) {
            obj = obj.clone();
            for ( var i = 0; i < props.length; i++ ) {
              var p = props[i];
              var v = values[i];
              obj[p.name] = v;
            }
            dao.put(obj);
          }
        });
      }
    }
  ]
});


/*
 * An extension to COUNT() which turns count into a link which performs
 * a query for only the selected data when clicked.
 */
MODEL({
  name: 'ItemCount',
  extendsModel: 'CountExpr',

  properties: [
    {
      name: 'browser'
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      console.assert( this.__ctx__.QueryParser, 'QueryParser not found');
    },
    toHTML: function() {
      this.eid = View.getPrototype().nextID();
      return '<span id="' + this.eid + '" class="idcount">' + this.count + '&nbsp;' + (this.count == 1 ? 'item' : 'items') + '</span>';
    },
    initHTML: function() {
      var f = function() {
        var altView = this.browser.view;
        var col = altView.views[1].view().col.data;
        var row = altView.views[1].view().row.data;
        var q = AND(
          this.__ctx__.QueryParser.parseString(this.browser.location.q),
          AND(EQ(col, this.x),
              EQ(row, this.y)).partialEval()).partialEval();
        this.browser.location.mode = Location.MODE.fromMemento.call(this.browser, 'list');
        this.browser.location.q = q.toMQL();
      }.bind(this);
      $(this.eid).addEventListener('click', f, false);
    }
  }
});


// Formats Issue ID's as links to the main crbug.com site.
var IdFormatter = function(browser) {
  return {
    f: function(i) {
      var url = browser.url + '/issues/detail?id=' + i.id;
      return '<a target="_blank" href="' + url + '">' + i.id + '</a>&nbsp;';
    }
  };
};


var priColorMap = {
  colorMap: {
    Critical: 'hsl(   0, 100%, 70%)',
    High:     'hsl(-340, 100%, 70%)',
    Medium:   'hsl(-320, 100%, 70%)',
    Low:      'hsl(-300, 100%, 70%)',
    '':       'lightgray'
  }
};


var QIssueTableView = FOAM({
  model_: 'Model',

  name: 'QIssueTableView',

  extendsModel: 'TableView',

  properties: [
    { name: 'browser' }
  ],

  methods: {
    /*
    initHTML: function() {
      this.SUPER();

      this.selection.addListener(function(_,_,_,obj) {
        if ( obj.id && obj.id !== this.browser.previewID ) this.browser.preview(null);
      });
    },
    */
    toHTML: function() {
      return '<div class="QIssueTableHeader"></div>' + this.SUPER();
    }
  }
});


function createView(rowSelectionValue, browser) {
  var X = browser.__ctx__;
  var location = browser.location;

  return X.AlternateView.create({
    dao: browser.filteredIssueDAO$Proxy,
    headerView: browser.countField,
    views: [
      ViewChoice.create({
        label: 'List',
        view: function() {
          var tableView = X.QIssueTableView.create({
            model:               X.QIssue,
            dao:                 browser.filteredIssueDAO$Proxy,
            browser:             browser,
            hardSelection$:      rowSelectionValue,
            columnResizeEnabled: true,
            scrollEnabled:       true,
            editColumnsEnabled:  true
          }, browser.__ctx__);

          tableView.sortOrder$  = location.sort$;
          tableView.properties$ = location.colspec$;

          tableView.window = X.window;  // TODO: fix
          return tableView;
        }
      }),
      X.ViewChoice.create({
        label: 'Grid',
        view: function() {
           // TODO: this is a bit complex because it was written before Contexts. Fix.
           var g = Model.create({
              name: 'QIssueGridView',
              extendsModel: 'GridView',
              methods: {
                filteredDAO: function() {
                  return ( this.acc.choice && this.acc.choice[1] === 'Tiles' ) ?
                    this.dao.limit(2000) :
                    this.dao ;
                }
              }
              }).create({
                model: X.QIssue,
                accChoices: [
                  [ MAP(X.QIssueTileView.create({browser: browser}), COL.create()), "Tiles" ],
                  [ MAP(IdFormatter(browser), COL.create()),                      "IDs" ],
                  [ X.ItemCount.create({browser: browser}),                         "Counts" ],
                  [ PIE(X.QIssue.STATUS),                                           "Pie(Status)"  ],
                  [ PIE(X.QIssue.PRIORITY, priColorMap),                            "Pie(Priority)" ]
                  // [ PIE(X.QIssue.STATE, {colorMap: {open:'red',closed:'green'}}), "PIE(State)" ]
                ],
                grid: /*GridByExpr*/X.DragAndDropGrid.create({dao: browser.filteredIssueDAO$Proxy})
           }, X);

          g.row.data$   = location.y$;
          g.col.data$   = location.x$;
          g.scrollMode$ = location.scroll$;

          // TODO: cleanup this block
          function setAcc() {
            var acc = g.accChoices[0];
            for ( var i = 1 ; i < g.accChoices.length ; i++ ) {
              if ( location.cells === g.accChoices[i][1].toLowerCase() ) acc = g.accChoices[i];
            }
            g.acc.choice = acc;
          }
          setAcc(location.cells);

          g.acc.data$.addListener(function(choice) { location.cells = g.acc.label.toLowerCase(); });
          location.cells$.addListener(setAcc);

          return g;
        }
      }, X)
    ]
  });
}


MODEL({
  name: 'GriddedStringArrayView',
  extendsModel: 'View',

  properties: [
    {
      model_: 'StringProperty',
      name: 'name'
    },
    {
      model_: 'StringProperty',
      name: 'type',
      defaultValue: 'text'
    },
    {
      model_: 'IntProperty',
      name: 'displayWidth',
      defaultValue: 30
    },
    {
      model_: 'BooleanProperty',
      name: 'autocomplete',
      defaultValue: true
    },
    {
      name: 'data',
      getter: function() { return this.softData; },
      setter: function(value) {
        this.softData = value;
        this.update();
      },
    },
    {
      name: 'softData',
      postSet: function(oldValue, newValue) {
        this.propertyChange('data', oldValue, newValue);
      }
    },
    'autocompleter',
    {
      model_: 'ArrayProperty',
      subType: 'TextFieldView',
      name: 'inputs'
    },
    {
      name: 'lastInput',
      postSet: function(old, v) {
        old && old.data$.removeListener(this.addRow);
        v.data$.addListener(this.addRow);
      }
    }
  ],

  methods: {
    toHTML: function() {
      var link = ActionButton.create({
        action: this.model_.ADD,
        data: this
      });
      this.addChild(link);

      return '<div id="' + this.id + '"><div></div>' +
        link.toHTML() +
        '</div>';
    },
    initHTML: function() {
      this.SUPER();
      this.update();
    },
    field: function() {
      return this.__ctx__.TextFieldView.create({
        name: this.name,
        type: this.type,
        displayWidth: this.displayWidth,
        autocomplete: this.autocomplete,
        autocompleter: this.autocompleter
      });
    }
  },

  listeners: [
    {
      name: 'addRow',
      code: function() {
        var views = [this.field(),
                     this.field(),
                     this.field()];

        this.addChildren.apply(this, views);
        this.inputs = this.inputs.concat(views);
        views[0].data$.addListener(this.onInput);
        views[1].data$.addListener(this.onInput);
        views[2].data$.addListener(this.onInput);

        var inputElement = this.$.firstElementChild;
        inputElement.insertAdjacentHTML('beforeend',
                                        '<div>' +
                                        views[0].toHTML() +
                                        views[1].toHTML() +
                                        views[2].toHTML() +
                                        '</div>');

        views[0].initHTML();
        views[1].initHTML();
        views[2].initHTML();

        this.lastInput = views[2];
      }
    },
    {
      name: 'update',
      code: function() {
        if ( ! this.$ ) return;

        this.$.firstElementChild.innerHTML = '';
        this.inputs = [];

        var i = 0;
        while ( this.inputs.length < Math.max(6, this.softData.length) ) {
          var views = [this.field(),
                       this.field(),
                       this.field()];

          this.addChildren.apply(this, views);
          this.inputs = this.inputs.concat(views);

          views[0].data = i < this.softData.length ? this.softData[i++] : '';
          views[1].data = i < this.softData.length ? this.softData[i++] : '';
          views[2].data = i < this.softData.length ? this.softData[i++] : '';

          views[0].data$.addListener(this.onInput);
          views[1].data$.addListener(this.onInput);
          views[2].data$.addListener(this.onInput);

          var inputElement = this.$.firstElementChild;
          inputElement.insertAdjacentHTML('beforeend',
                                          '<div>' +
                                          views[0].toHTML() +
                                          views[1].toHTML() +
                                          views[2].toHTML() +
                                          '</div>');

          views[0].initHTML();
          views[1].initHTML();
          views[2].initHTML();

          this.lastInput = views[2];
        }
      }
    },
    {
      name: 'onInput',
      code: function(e) {
        if ( ! this.$ ) return;

        var newdata = [];

        var inputs = this.inputs;
        for ( var i = 0; i < inputs.length; i++ ) {
          if ( inputs[i].data ) newdata.push(inputs[i].data);
        }
        this.softData = newdata;
      }
    }
  ],

  actions: [
    {
      name: 'add',
      label: 'Add a row',
      action: function() {
        this.addRow();
      }
    }
  ]
});
