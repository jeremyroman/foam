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
/*
 * TODO:
 *    handle multiple-selection
 *    map <enter> key to <br>
 *    support removing/toggling an attribute
 *    check that the selected text is actually part of the element
 *    add the rest of the common styling options
 *    improve L&F
 *    add an optional HTML-sanitizer for hosted apps
 */

var ColorPickerView = FOAM({
  model_: 'Model',
  extendsModel: 'AbstractView',

  name: 'ColorPickerView',

  properties: [
    {
      name: 'value',
      valueFactory: function() { return SimpleValue.create({}); }
    }
  ],

  methods: {
    toHTML: function() {
      var out = '<table>';
      out += '<tr>';
      var self = this;
      var cell = function(r, g, b) {
        var value = 'rgb(' + r + ',' + g + ',' + b + ')';

        out += '<td class="pickerCell"><div id="' +
          self.registerCallback('click', function(e) {
            self.value.set(value);
            e.preventDefault();
          }) +
          '" class="pickerDiv" style="background-color: ' + value + '"></div></td>';
      };
      for ( var col = 0; col < 8; col++ ) {
        var shade = Math.floor(255 * col / 7);
        cell(shade, shade, shade);
      }
      out += '</tr><tr>'
      cell(255, 0, 0);
      cell(255, 153, 0);
      cell(255, 255, 0);
      cell(0, 255, 0);
      cell(0, 255, 255);
      cell(0, 0, 255);
      cell(153, 0, 255);
      cell(255, 0, 255);
      out += '</tr></table>'
      return out;
    }
  }
});

var RichTextView = FOAM({

  model_: 'Model',

  extendsModel: 'AbstractView',

  name: 'RichTextView',

  properties: [
    {
      name:  'height',
      type:  'int',
      view:  'IntFieldView',
      defaultValue: 400
    },
    {
      name:  'width',
      type:  'int',
      view:  'IntFieldView',
      defaultValue: 800
    },
    {
      name:  'mode',
      type:  'String',
      defaultValue: 'read-write',
      view: {
        create: function() { return ChoiceView.create({choices:[
          "read-only", "read-write", "final"
        ]}); } }
    },
    {
      name:  'value',
      type:  'Value',
      valueFactory: function() { return SimpleValue.create(); },
      postSet: function(newValue, oldValue) {
        Events.unfollow(this.domValue, oldValue);
        Events.follow(this.domValue, newValue);
      }
    },
    {
      name: 'document',
      hidden: true
    }
  ],

  methods: {
    toHTML: function() {
      var m = this.mode === 'read-write' ? ' contenteditable' : '';
      var id = this.getID();
      return '<iframe style="border:solid 2px #b7ddf2;width:' + this.width + 'px;min-height:' + this.height + 'px" id="' + this.getID() + '"></iframe>';
    },

    setValue: function(value) {
      this.value = value;
    },

    initHTML: function() {
      this.SUPER();
      this.document = this.$.contentDocument;
      this.document.body.contentEditable = true;
      this.domValue = DomValue.create(this.document.body, 'input', 'innerHTML');
      this.value = this.value;
    },

    destroy: function() {
      Events.unlink(this.domValue, this.value);
    },

    textToValue: function(text) { return text; },

    valueToText: function(value) { return value; },

    setForegroundColor: function(color) {
      this.$.contentWindow.focus();
      this.document.execCommand("foreColor", false, color);
    },

    setBackgroundColor: function(color) {
      this.$.contentWindow.focus();
      this.document.execCommand("backColor", false, color);
    }
  },

  actions: [
    {
      model_: 'Action',
      name: 'bold',
      label: '<b>B</b>',
      help: 'Bold text.',
      action: function () {
        this.$.contentWindow.focus();
        this.document.execCommand("bold");
      }
    },
    {
      model_: 'Action',
      name: 'italic',
      label: '<i>i</i>',
      help: 'Italic text.',
      action: function () {
        this.$.contentWindow.focus();
        this.document.execCommand("italic");
      },
    },
    {
      model_: 'Action',
      name: 'underline',
      label: '<u>u</u>',
      help: 'Underline text.',
      action: function () {
        this.$.contentWindow.focus();
        this.document.execCommand("underline");
      },
    },
    {
      model_: 'Action',
      name: 'fontSize',
      label: 'Font Size',
      help: 'Change the font size.',
      action: function(){}
    },
    {
      model_: 'Action',
      name: 'small',
      help: 'Set\'s the font size to small.',
      label: 'small',
      parent: 'fontSize',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontSize", false, "2");
      }
    },
    {
      model_: 'Action',
      name: 'normal',
      help: 'Set\'s the font size to normal.',
      label: 'normal',
      parent: 'fontSize',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontSize", false, "3");
      }
    },
    {
      model_: 'Action',
      name: 'large',
      help: 'Set\'s the font size to small.',
      label: 'large',
      parent: 'fontSize',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontSize", false, "5");
      }
    },
    {
      model_: 'Action',
      name: 'huge',
      help: 'Set\'s the font size to small.',
      label: 'huge',
      parent: 'fontSize',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontSize", false, "7");
      }
    },
    {
      model_: 'Action',
      name: 'fontFace',
      help: 'Set\'s the font face.',
      label: 'Font',
    },
    {
      model_: 'Action',
      name: 'sansSerif',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "arial, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'serif',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "times new roman, serif");
      }
    },
    {
      model_: 'Action',
      name: 'wide',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "arial bold, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'narrow',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "arial narrow, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'comicSans',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "comic sans, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'courierNew',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "courier new, monospace");
      }
    },
    {
      model_: 'Action',
      name: 'garamond',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "garamond, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'georgia',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "georgia, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'tahoma',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "tahoma, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'trebuchet',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "trebuchet ms, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'verdana',
      help: 'Set\'s the font face.',
      parent: 'fontFace',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("fontName", false, "verdana, sans-serif");
      }
    },
    {
      model_: 'Action',
      name: 'removeFormatting',
      help: 'Removes formatting from the current selection.',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("removeFormat");
      }
    },
    {
      model_: 'Action',
      name: 'justification',
      action: function(){}
    },
    {
      model_: 'Action',
      name: 'leftJustify',
      parent: 'justification',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("justifyLeft");
      }
    },
    {
      model_: 'Action',
      name: 'centerJustify',
      parent: 'justification',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand("justifyCenter");
      }
    },
    {
      model_: 'Action',
      name: 'rightJustify',
      parent: 'justification',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand('justifyRight');
      }
    },
    {
      model_: 'Action',
      name: 'numberedList',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand('insertOrderedList');
      }
    },
    {
      model_: 'Action',
      name: 'bulletList',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand('insertUnorderedList');
      }
    },
    {
      model_: 'Action',
      name: 'decreaseIndentation',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand('outdent');
      }
    },
    {
      model_: 'Action',
      name: 'increaseIndentation',
      action: function() {
        this.$.contentWindow.focus();
        this.document.execCommand('indent');
      }
    },
    {
      model_: 'Action',
      name: 'blockQuote',
      action: function() {
        this.$.contentWindow.focus();
      }
    }
  ]

});