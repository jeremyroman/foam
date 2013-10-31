/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

/* TODO:
     - parse multiple addresses in 'to'
     - needs better end-of-attachment handling so it doesn't detect and parse
       emails embeded as attachments in other emails
*/

function lazyEval(fn) {
   var result;
   return function() {
      if ( ! result ) {
         result = fn.call(this);
      }
      return result;
   };
};

var EMailLabel = FOAM({
    model_: 'Model',
    name: 'EMailLabel',
    label: 'EMailLabel',

    ids: [ 'id' ],

    properties: [
        {
            model_: 'StringProperty',
            name: 'id',
            label: 'Label ID'
        },
        {
            model_: 'StringProperty',
            name: 'displayName',
            label: 'Display Name'
        },
        {
            model_: 'IntegerProperty',
            name: 'color',
            label: 'color',
            defaultValue: 0
        }
    ],

    methods: {
        // TODO:  Not an exhaustive list
        SystemLabels: {
          ALL:       '^all',
          DRAFT:     '^r',
          IMPORTANT: '^io_im',
          INBOX:     '^i',
          MUTED:     '^g', // 'g' is second letter of 'ignored'
          OPENED:    '^o',
          REPLIED:   '^io_re', // User has replied to this message
          SENT:      '^f',
          SPAM:      '^s',
          STARRED:   '^t', // 't' originall stood for TODO
          TRASH:     '^k',
          UNREAD:    '^u'
        },

        RENDERABLE_SYSTEM_LABELS: lazyEval(function() {
          var result = {};
          var SystemLabels = this.SystemLabels;
          result[SystemLabels.INBOX]     = true;
          result[SystemLabels.STARRED]   = true;
          result[SystemLabels.IMPORTANT] = true;
          result[SystemLabels.SPAM]      = true;
          result[SystemLabels.TRASH]     = true;
          result[SystemLabels.DRAFT]     = true;
          result[SystemLabels.SENT]      = true;
          result[SystemLabels.MUTED]     = true;
          result[SystemLabels.UNREAD]    = true;
          return result;
        }),

        SYSTEM_LABEL_RENDER_NAMES: lazyEval(function() {
          var result = {};
          var SystemLabels = this.SystemLabels;
          result[SystemLabels.ALL]       = 'All Mail';
          result[SystemLabels.INBOX]     = 'Inbox';
          result[SystemLabels.STARRED]   = 'Starred';
          result[SystemLabels.IMPORTANT] = 'Important';
          result[SystemLabels.SPAM]      = 'Spam';
          result[SystemLabels.TRASH]     = 'Trash';
          result[SystemLabels.DRAFT]     = 'Draft';
          result[SystemLabels.SENT]      = 'Sent';
          result[SystemLabels.MUTED]     = 'Muted';
          result[SystemLabels.UNREAD]    = 'Unread';
          result[SystemLabels.REPLIED]   = 'Replied';
          result[SystemLabels.OPENED]    = 'Opened';
          return result;
        }),

        SEARCHABLE_SYSTEM_LABELS: lazyEval(function() {
          var result = {};
          var SystemLabels = this.SystemLabels;
          result[SystemLabels.ALL]       = true;
          result[SystemLabels.INBOX]     = true;
          result[SystemLabels.STARRED]   = true;
          result[SystemLabels.IMPORTANT] = true;
          result[SystemLabels.SPAM]      = true;
          result[SystemLabels.TRASH]     = true;
          result[SystemLabels.DRAFT]     = true;
          result[SystemLabels.SENT]      = true;
          return result;
        }),

        isSystemLabel: function() {
          return this.displayName.charAt(0) == '^';
        },

        isRenderable: function() {
          return !this.isSystemLabel() || this.RENDERABLE_SYSTEM_LABELS()[this.displayName];
        },

        getRenderName: function() {
          var displayName = this.displayName;
          return this.SYSTEM_LABEL_RENDER_NAMES()[displayName] || displayName;
        },

        isSearchable: function() {
          return !this.isSystemLabel() || this.SEARCHABLE_SYSTEM_LABELS()[this.displayName];
        },

        getSearch: function() {
          switch(this.displayName) {
           case this.SystemLabels.ALL:
            return '-label:^r,^s,^k';
           case this.SystemLabels.SENT:
            return 'f:me';
           default:
            return 'label:"' + this.displayName + '"';
          }
        }
    }
});

var EMailPreference = FOAM({
    model_: 'Model',
    name: 'EMailPreference',
    label: 'EMailPreference',

    ids: [ 'name' ],

    properties: [
        {
            model_: 'StringProperty',
            name: 'name',
            label: 'Preference Name'
        },
        {
            model_: 'StringProperty',
            name: 'value',
            label: 'Preference Value'
        }
    ]
});

var Attachment = FOAM({
   model_: 'Model',
   name: 'Attachment',
   plural: 'Attachments',
   ids: [ 'filename' ],
   tableProperties:
   [
      'type',
      'filename',
      'position',
      'size'
   ],
   properties:
   [
      {
         model_: 'Property',
         name: 'filename',
         label: 'File Name',
         type: 'String',
         displayWidth: 50,
         view: 'TextFieldView'
      },
      {
         model_: 'Property',
         name: 'type',
         type: 'String',
         displayWidth: 30,
         view: 'TextFieldView'
      },
      {
         model_: 'Property',
         name: 'size',
         type: 'int',
         displayWidth: 10,
         view: 'TextFieldView'
      },
      {
         model_: 'Property',
         name: 'position',
         type: 'int',
         displayWidth: 10,
         view: 'TextFieldView'
      }
   ],
   actions:
   [
      {
         model_: 'Action',
         name: 'view',
         help: 'View an attachment.',
         action: function () {
         }
      }
   ]
});


var EMail = FOAM({
   model_: 'Model',
   name: 'EMail',
   plural: 'EMail',
   ids: [ 'id' ],
   tableProperties:
   [
      'from',
//      'to',
      'subject',
//      'attachments',
      'timestamp'
   ],
   properties:
   [
      {
         model_: 'StringProperty',
         name: 'id',
         label: 'Message ID',
         mode: 'read-write',
         required: true,
         displayWidth: 50,
         hidden: true
      },
      {
         model_: 'StringProperty',
         name: 'convId',
         label: 'Conversation ID',
         mode: 'read-write',
         hidden: true,
         displayWidth: 30
      },
      {
         model_: 'DateProperty',
         name: 'timestamp',
         aliases: ['time', 'modified', 't'],
         label: 'Date',
         type: 'String',
         mode: 'read-write',
         required: true,
         displayWidth: 45,
         displayHeight: 1,
         view: 'TextFieldView',
         tableWidth: '100',
         preSet: function (d) {
           if (typeof d === 'string' || typeof d === 'number')
             return new Date(d);
           return d;
         },
         valueFactory: function() { return new Date(); }
      },
      {
         model_: 'StringProperty',
         name: 'from',
         shortName: 'f',
         mode: 'read-write',
         required: true,
         displayWidth: 90,
         tableWidth: '120',
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         },
         valueFactory: function() { return GLOBAL.user || ""; }
      },
      {
         model_: 'StringArrayProperty',
         name: 'to',
         shortName: 't',
         required: true,
         displayWidth: 90,
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         }
      },
      {
         model_: 'StringArrayProperty',
         name: 'cc',
         required: true,
         displayWidth: 90,
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         }
      },
      {
         model_: 'StringArrayProperty',
         name: 'bcc',
         required: true,
         displayWidth: 90,
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         }
      },
      {
         model_: 'Property',
         name: 'subject',
         shortName: 's',
         type: 'String',
         mode: 'read-write',
         required: true,
         displayWidth: 100,
         tableWidth: '45%',
         view: 'TextFieldView'
      },
      {
         model_: 'StringArrayProperty',
         name: 'labels',
         view: 'LabelView',
         postSet: function(a) {
           for ( var i = 0 ; i < a.length ; i++ ) a[i] = a[i].intern();
         },
         help: 'Email labels.'
      },
      {
         model_: 'Property',
         name: 'attachments',
         label: 'Attachments',
         tableLabel: '@',
         type: 'Array[Attachment]',
         subType: 'Attachment',
         view: 'ArrayView',
         valueFactory: function() { return []; },
         tableWidth: '20',
         tableFormatter: function(a) {
           return a.length ? a.length : "";
         },
         help: 'Email attachments.'
      },
      {
         model_: 'StringProperty',
         name: 'body',
         shortName: 'b',
         label: '',
//         view: 'RichTextView',
         displayWidth: 70,
         displayHeight: 20,
         help: 'Email message body.',
         summaryFormatter: function(t) {
           return '<div class="messageBody">' + t.replace(/\n/g,'<br/>') + '</div>';
         }
      }
   ],

   methods: {
      updateLabelByName: function(id) {
         var self = this;
         EMailLabels.find(EQ(EMailLabel.DISPLAY_NAME, id), {put: function(label) {
            var mail = self.clone(); mail.toggleLabel(label.id); EMails.put(mail);
         }});
      },
      hasLabel: function(l) { return this.labels.indexOf(l) != -1; },
      toggleLabel: function(l) { this.hasLabel(l) ? this.removeLabel(l) : this.addLabel(l); },
      addLabel: function(l) { this.labels = this.labels.deleteF(l).pushF(l); },
      removeLabel: function(l) { this.labels = this.labels.deleteF(l); },
      toMimeBody: function() {
        return (
            "From: " + this.from + "\r\n" +
            "To: " + this.to.join(', ') + "\r\n" +
            (this.cc.length ? "Cc: " + this.cc.join(", ") + "\r\n" : "") +
            (this.bcc.length ? "Bcc: " + this.bcc.join(", ") + "\r\n" : "") +
            "Subject: " + this.subject + "\r\n" +
            "Content-Type: text/plain; charset=ISO-8859-1; format=flowed; delsp=yes\r\n" +
            this.body +
            "\r\n\r\n");
      }
   },

   actions:
   [
      {
         model_: 'Action',
         name: 'send',
         help: 'Send the email.',
         action: function () {
           EmailDAO.put(this);
           stack.back();
         }
      },
      {
         model_: 'Action',
         name: 'reply',
         help: 'Reply to an email.',
         action: function () {
           var replyMail = EMail.create({
             to: this.from,
             from: ME || this.to,
             subject: "Re.: " + this.subject,
             body: this.body.replace(/^|\n/g, '\n>'),
             id: Math.floor(Math.random() * 0xffffff).toVarintString()
           });
           DAOCreateController.getPrototype().newObj(replyMail, EMails);
         }
      },
      {
         model_: 'Action',
         name: 'replyAll',
         help: 'Reply to all recipients of an email.',
         action: function () {
           var replyMail = EMail.create({
             to: this.from,
             from: ME || this.to,
             subject: "Re.: " + this.subject,
             body: this.body.replace(/^|\n/g, '\n>'),
             id: Math.floor(Math.random() * 0xffffff).toVarintString()
           });

           for ( var i = 0 ; i < this.to ; i++ ) {
              replyMail.to.push(this.to[i]);
           }
           DAOCreateController.getPrototype().newObj(replyMail, EMails);
         }
      },
      {
         model_: 'Action',
         name: 'forward',
         help: 'Forward an email.',
         action: function () {
           var forwardedMail = EMail.create({
             from: ME,
             subject: "Fwd.: " + this.subject,
             body: this.body.replace(/^|\n/g, '\n>'),
             id: Math.floor(Math.random() * 0xffffff).toVarintString()
           });
           DAOCreateController.getPrototype().newObj(forwardedMail, EMails);
         }
      },
      {
         model_: 'Action',
         name: 'star',
         help: 'Star an email.',
         action: function () { this.updateLabelByName('^t'); }
      },
      {
         model_: 'Action',
         name: 'archive',
         help: 'Archive an email.',
         action: function () { this.updateLabelByName('^i'); }
      },
      {
         model_: 'Action',
         name: 'spam',
         help: 'Report an email as SPAM.',
         action: function () {
             var mail = this;
             apar(
               function(ret) {
                 EMailLabels.where(EQ(EMailLabel.DISPLAY_NAME, "^i")).select({
                   put: ret
                 });
               },
               function(ret) {
                 EMailLabels.where(EQ(EMailLabel.DISPLAY_NAME, "^s")).select({
                   put: ret
                 });
               })(function(inbox, spam) {
                 mail = mail.clone();
                 mail.removeLabel(inbox.id);
                 mail.addLabel(spam.id);
                 EMails.put(mail);
               });
         }
      },
      {
         model_: 'Action',
         name: 'trash',
         help: 'Move an email to the trash.',
         action: function () {
             var mail = this;
             apar(
               function(ret) {
                 EMailLabels.where(EQ(EMailLabel.DISPLAY_NAME, "^i")).select({
                   put: ret
                 });
               },
               function(ret) {
                 EMailLabels.where(EQ(EMailLabel.DISPLAY_NAME, "^k")).select({
                   put: ret
                 });
               })(function(inbox, trash) {
                 mail = mail.clone();
                 mail.removeLabel(inbox.id);
                 mail.addLabel(trash.id);
                 EMails.put(mail);
               });
         }
      }
   ]
});


var EmailAddressParser = {
  __proto__: grammar,

  START: sym('address'),

  'until eol': repeat(notChar('\r')),

  'address list': repeat(sym('address'), seq(',', repeat(' '))),

  'address': alt(
    sym('labelled address'),
    sym('simple address')),

  'labelled address': seq(
    repeat(notChars('<,')),
    '<', sym('simple address'), '>'),

  'simple address': seq(repeat(notChar('@')), '@', repeat(notChars('\r>,')))
}.addActions({
  'labelled address': function(v) { return v[0].join('') + v[1] + v[2] + v[3]; },
  'simple address': function(v) { return v[0].join('') + v[1] + v[2].join(''); }
});


var MBOXParser = {
  __proto__: grammar,

  START: sym('line'),

  'eol': literal('\n'),

  'until eol': repeat(notChar('\r')),

  line: alt(
    sym('start of email'),
    sym('id'),
    sym('conversation id'),
    sym('to'),
    sym('from'),
    sym('subject'),
    sym('date'),
    sym('labels'),
    sym('start of block'),
    sym('start of body'),
    sym('start of attachment')
  ),

  'start of email': seq('From ', sym('until eol')),

  id: seq('Message-ID: ', sym('until eol')),

  'conversation id': seq('X-GM-THRID: ', sym('until eol')),

  address: EmailAddressParser.export('address'),

  'address list': EmailAddressParser.export('address list'),

//  to: seq('To: ', repeat(not(alt(',', '\r'))) /*sym('until eol')*/),
  to: seq('To: ', sym('until eol')),
  from: seq('From: ', sym('until eol')),

  labels: seq('X-Gmail-Labels: ', repeat(sym('label'), ',')),

  label: repeat(alt(range('a','z'), range('A', 'Z'), range('0', '9'))),

  subject: seq('Subject: ', sym('until eol')),

  date: seq('Date: ', sym('until eol')),

  'other': sym('until eol'),

  'start of block': seq(
    '--', sym('until eol')),

  'start of body': seq(
    'Content-Type: text/plain; ',
    sym('until eol')
    ),

  'end of body': alt(
    seq('Content-Transfer-Encoding:', sym('until eol')),
    '--',
    '\n--'), // TODO: remove this line when reader fixed!

  'start of attachment': seq(
    'Content-Type: ', repeat(notChar(';')), '; name="', sym("filename"), '"', sym('until eol')
//    'Content-Disposition: attachment; filename="', sym("filename"), '"', sym('until eol')
    ),

  filename: repeat(notChar('"'))

};

/** Sink which loads Emails into a DAO. **/
var MBOXLoader = {
  __proto__: MBOXParser,

  ps: StringPS.create(""),

  PARSE_HEADERS_STATE: function HEADERS(str) {
    this.parseString(str);
  },

  READ_BODY_STATE: function BODY(str) {
    if ( str.slice(0, 5) === 'From ' ) {
      this.state = this.PARSE_HEADERS_STATE;
      this.state(str);
      return;
    }

    if ( str.indexOf(this.blockId) == 2 && str.slice(-3, -1) == '--' ) {
      this.state = this.PARSE_HEADERS_STATE;
      this.blockId = undefined;
    }

    this.b.push(str.trimRight());
  },

  SKIP_ATTACHMENT_STATE: function ATTACHMENT(str) {
    var att = this.email.attachments[this.email.attachments.length-1];
    if ( str.slice(0, 5) === 'From ' ) {
      att.size = att.pos - att.position;
      this.state = this.PARSE_HEADERS_STATE;
      this.state(str);
      return;
    }

    if ( str.indexOf(this.blockId) == 2 && str.slice(-3, -1) == '--' ) {
      att.size = att.pos - att.position;
      this.state = this.PARSE_HEADERS_STATE;
      this.blockId = undefined;
    }
  },

  created: 0, // No of Emails created

  lineNo: 0,  // Current Line Number in mbox file

  pos: 0,     // Current byte position in mbox file

  segPos: 0,

  put: function(str) {
    if ( this.lineNo == 0 ) {
      this.segStartTime = this.startTime = Date.now();
      this.state = this.PARSE_HEADERS_STATE;
    }

    this.lineNo++;
    this.pos += str.length;

    if ( ! ( this.lineNo % 100000 ) ) {
      var lps = Math.floor(this.lineNo / (Date.now() - this.startTime));
      var bps = Math.floor(this.pos / (Date.now() - this.startTime));
      var slps = Math.floor(100000 / (Date.now() - this.segStartTime));
      var sbps = Math.floor((this.pos-this.segPos) / (Date.now() - this.segStartTime));

      console.log(
        'line: ' + Math.floor(this.lineNo/1000) +
        'k  time: ' + Math.floor((Date.now() - this.startTime)) +
        'ms  bytes: ' + Math.floor(this.pos/1000) +
        'k  created: ' + this.created +
        '    SEGMENT:',
        ' lps: ' + slps +
        'k bps: ' + sbps + 'k' +
        '    TOTAL:',
        ' lps: ' + lps +
        'k bps: ' + bps + 'k ' +
        'state: ' + this.state.name);

      this.segStartTime = Date.now();
      this.segPos = this.pos;
    }

    this.state(str);
  },

  eof: function() { this.saveCurrentEmail(); },

  saveCurrentEmail: function() {
    if ( this.email ) {
      this.email.body = this.b.join('\n');

      var i = this.email.body.indexOf("Content-Type:");
      if ( i != -1 ) this.email.body = this.email.body.slice(0,i);

      i = this.email.body.indexOf("Content-Transfer-Encoding: base64");
      if ( i != -1 ) this.email.body = this.email.body.slice(0,i);

      this.b = [];
      if ( this.email.to.length == 0 ) return;
      if ( this.email.to.indexOf('<<') != -1 ) return;
      if ( this.email.from.indexOf('<<') != -1 ) return;
      if ( this.email.to.indexOf('3D') != -1 ) return;
      if ( this.email.from.indexOf('3D') != -1 ) return;
      if ( this.email.from.indexOf('=') != -1 ) return;
      if ( this.email.from.indexOf('<') == 0 ) return;
      if ( this.email.from.indexOf(' ') == 0 ) return;

      this.created++;

      // console.log('creating: ', this.created);
      // console.log('creating: ', this.email.toJSON());
      if ( this.dao ) this.dao.put(this.email);
    }
  }
}.addActions({
  'start of email': function() {
    this.saveCurrentEmail();

    this.email = EMail.create();
    this.b = [];
  },

//  id: function(v) { this.email.id = v[1].join('').trim(); },
  id: function(v) { this.email.id = Math.floor(Math.random()*100000000); },

  'conversation id': function(v) { this.email.convId = v[1].join('').trim(); },

  to: function(v) {
    this.email.to = v[1].join('').trim();
    var i = this.email.to.indexOf(',');
    if ( i != -1 ) this.email.to = this.email.to.substring(0, i);
},

  from: function(v) { this.email.from = v[1].join('').trim(); },

  subject: function(v) { this.email.subject = v[1].join('').trim(); },

  date: function(v) { this.email.timestamp = new Date(v[1].join('').trim()); },

  label: function(v) { this.email.labels.push(v.join('')); },

  'start of block': function(v) {
     var blockId = v[1].join('');
     if ( blockId.slice(-2) == '--' ) return;
     this.blockId = blockId;
   },

  'start of body': function(v) {
    this.state = this.READ_BODY_STATE;
  },

  'start of attachment': function(v, unused, pos) {
    var attachment = Attachment.create({
      type: v[1].join(''),
      filename: v[3].join(''),
      position: this.pos
    });

    this.email.attachments.push(attachment);
    this.state = this.SKIP_ATTACHMENT_STATE;
  }

  // TODO: timestamp, message-id, body, attachments
  // TODO: internalize common strings to save memory (or maybe do it at the DAO level)

});


var EMailBody = FOAM({
    model_: 'Model',
    name: 'EMailBody',
    label: 'EMailBody',

    ids: [
        'offset',
        'size'
    ],

    properties: [
        {
            name: 'offset',
            type: 'Integer',
            required: true
        },
        {
            name: 'size',
            type: 'Integer',
            required: true
        },
        {
            name: 'value',
            type: 'String',
            defaultValue: ''
        }
    ],

    methods: {
    }
});