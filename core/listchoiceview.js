/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
var ListChoiceViewRenderer = {
  start: function(id) {
    return '<ul id="' + id + '"/>';
  },
  choice: function(name, c, autoId, index, isCurrentSelection) {
    return '<li id="' + autoId + '" name="' + name + '"' +
        (isCurrentSelection ? ' class="' + this.selectedCssClass + '"' : '') +
        ' value="' + index + '">' + c.n.toString() + '</li>';
  },
  end: function() {
    return '</ul>';
  }
};

var ListChoiceView = FOAM({

   model_: 'Model',

   extendsModel: 'AbstractView',

   name:  'ListChoiceView',

   properties: [
      {
         name:  'name',
         type:  'String',
         defaultValue: 'field'
      },
      {
         name:  'helpText',
         type:  'String',
         defaultValue: undefined
      },
      {
         name:  'cssClass',
         type:  'String',
         defaultValue: 'foamListChoiceView'
      },
      {
         name:  'selectedCssClass',
         type:  'String',
         defaultValue: 'foamListChoiceViewSelected'
      },
      {
         name:  'value',
         type:  'Value',
         valueFactory: function() { return SimpleValue.create(); }
      },
      {
         name:  'choicesDao',
         type:  'DAO',
         help:  'A DAO providing choices to populate the list.',
         defaultValue: undefined,
         postSet: function(_, newValue) {
           newValue.listen({
              put: EventService.merged(this.updateHTML.bind(this), 500),
              remove: EventService.merged(this.updateHTML.bind(this), 500)
           });
         }
      },
      {
         name:  'displayNameProperty',
         type:  'Property',
         help:  'The property used to retrieve the display name from the DAO'
         //defaultValue: { f: this.displayName.bind(this) }
      },
      {
         name:  'valueProperty',
         type:  'Property',
         help:  'The property used to retieve the value from the DAO'
         //defaultValue: { f: this.value.bind(this) }
      },
      {
         name:  'renderableProperty',
         type:  'Property',
         help:  'The property used to query the DOA to see if the choice is renderable.',
         defaultValue: { f: function() { return true; } }
      },
      {
         name:  'choices',
         type:  'Array[StringField]',
         help: 'Array of choices or array of { n: name, v: value } pairs.',
         defaultValue: [],
         postSet: function() {
         }
      },
      {
         name:  'initialSelectionValue',
         type:  'Value',
         valueFactory: function() { return SimpleValue.create(); }
      },
      {
         name:  'renderer',
         help:  'The renderer that renders the view.',
         defaultValue:  ListChoiceViewRenderer
      }
   ],

   methods: {
     toHTML: function() {
       var renderer = this.renderer;
       var out = renderer.start(this.getID()) + renderer.end();
       return out;
     },

     updateHTML: function() {
       var self = this;
       if (this.choicesDao) {
         var choices = [];
         this.choicesDao.select({ put: function(c) {
           if (self.renderableProperty.f(c)) {
             c = { n: self.displayNameProperty.f(c), v: self.valueProperty.f(c), o: c };
             choices.push(c);
           }
         }})(function() {
           var oldChoices = self.choices;
           if (oldChoices != choices) {
             self.choices = choices;
             self.listToHTML();
           }
         });
       } else {
         self.listToHTML();
       }
     },

     listToHTML: function() {
       var out = [];

       // TODO
       if ( this.helpText ) {
       }

       for ( var i = 0 ; i < this.choices.length ; i++ ) {
         var choice = this.choices[i];
         var id     = this.nextID();
         var name   = this.name;

         try {
           this.on('click', this.onClick, id);
           this.on('mouseover', this.onMouseOver, id);
           this.on('mouseout', this.onMouseOut, id);
         } catch (x) {
         }

         var isCurrentSelection = this.prev ? choice.v == this.prev.get() :
             this.value ? choice.v == this.value.get() :
             choice.v == this.initialSelectedValue.get();

         out.push(this.renderer.choice(name, choice, id, i, isCurrentSelection));
       }

       this.$.innerHTML = out.join('');

       selectedAsList = this.$.getElementsByClassName(this.selectedCssClass);
       if (selectedAsList && selectedAsList.length) {
         this.selectedElement = selectedAsList[0];
       }

       AbstractView.getPrototype().initHTML.call(this);
     },

     getValue: function() {
       return this.value;
     },

     setValue: function(value) {
       Events.unlink(this.domValue, this.value);
       this.value = value;
       var self = this;
       Events.relate(
         value,
         this.domValue,
         function (v) {
           for ( var i = 0 ; i < self.choices.length ; i++ ) {
             var c = self.choices[i];
             if ( c.v === v ) return i;
           }
           return v;
         },
         function (v) { return self.indexToValue(v); }
       );
     },

     initHTML: function() {
       var e = this.$;

       Events.dynamic(function() { this.choices; }.bind(this), this.listToHTML.bind(this));

       this.updateHTML();

       this.domValue = DomValue.create(e);

       this.setValue(this.value);
     },

     destroy: function() {
       Events.unlink(this.domValue, this.value);
     },

     indexToValue: function(v) {
       var i = parseInt(v);
       if ( isNaN(i) ) return v;

       return this.choices[i].v;
     },

     evtToValue: function(e) { return this.indexToValue(e.target.getAttribute('value')); }
   },

   listeners:
   [
      {
         model_: 'Method',

         name: 'onMouseOver',
         code: function(e) {
           if ( this.timer_ ) window.clearTimeout(this.timer_);
           this.prev = ( this.prev === undefined ) ? this.value.get() : this.prev;
           this.value.set(this.evtToValue(e));
         }
      },

      {
         model_: 'Method',

         name: 'onMouseOut',
         code: function(e) {
           if ( this.timer_ ) window.clearTimeout(this.timer_);
           this.timer_ = window.setTimeout(function() {
             this.value.set(this.prev || "");
             this.prev = undefined;
           }.bind(this), 1);
         }
      },

      {
         model_: 'Method',

         name: 'onClick',
         code: function(e) {
           this.prev = this.evtToValue(e);
           this.value.set(this.prev);
           if (this.selectedElement) {
             this.selectedElement.className = '';
           }
           e.target.className = 'selected';
           this.selectedElement = e.target;
         }
      }
   ]
});
