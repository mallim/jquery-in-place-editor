// REFACT: consider to split into 'closed editor' and 'open editor'
describe( 'editor behaviour', function () {

  describe( 'marker classes', function () {

    beforeEach(function() {
      sinon.stub( $, "ajax" ).yieldsTo( "success", '<form class="inplace_form" style="display: inline; margin: 0; padding: 0;"><input type="text" name="inplace_value" class="inplace_field" size="null"></form>' );
    });

    afterEach(function () {
      $.ajax.restore();
    });
    
    it( 'should set .editInPlace-active when activating editor', function ( done ) {
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.false;
      expect( this.enableEditor().click().hasClass( 'editInPlace-active' ) ).to.be.true;
      done();
    });

    it.skip( 'should remove .editInPlace-active when editor finished submitting', function ( done ) {
      this.openEditor();
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.true;
      this.sandbox.find( ':input' ).val( 'fnord' ).submit();
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.false;
      done();
    });

    it( 'should remove .editInPlace-active when cancelling the editor', function ( done ) {
      this.openEditor().submit();
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.false;
      done();
    });

    it( 'should remove .editInPlace-active when the callback returns if no animation callbacks are used', function ( done ) {
      this.edit({
        callback:function(){
          return '';
        }
      }, 'bar' );
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.false;
      done();
    });

    it( 'should not remove .editInPlace-active if didStartSaving() is called before callback returns', function ( done ) {
      var callbacks;
      function callback() {
        callbacks = arguments[4];
        callbacks.didStartSaving();
        return '';
      }
      this.edit({ callback:callback });
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.true;
      callbacks.didEndSaving();
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.false;
      done();
    });

    it( 'should ignore animation callbacks after submit callback has returned', function ( done ) {
      var callbacks;
      function callback(idOfEditor, enteredText, orinalHTMLContent, settingsParams, animationCallbacks) {
        callbacks = animationCallbacks;
        return '';
      }
      this.edit({ callback: callback });
      expect( this.sandbox.hasClass( 'editInPlace-active' ) ).to.be.false;

      var didStartSaving = function () { callbacks.didStartSaving() };
      expect( didStartSaving ).to.throw( Error );

      var didEndSaving = function () { callbacks.didEndSaving() };
      expect( didEndSaving ).to.throw( Error );

      done();
    });

    it( 'throws if calling didEndSaving() in the callback before didStartSaving() was called', function ( done ) {
      var callbacks;
      function callback(idOfEditor, enteredText, orinalHTMLContent, settingsParams, animationCallbacks) {
        var didEndSaving = function(){ animationCallbacks.didEndSaving() };
        expect( didEndSaving ).to.throw( Error ); /*Cannot call*/
        return '';
      };
      this.edit({ callback: callback });
      done();
    });

    it( 'should allow to call both callbacks before the callback returns', function ( done ) {
      function callback(idOfEditor, enteredText, orinalHTMLContent, settingsParams, animationCallbacks) {
        animationCallbacks.didStartSaving();
        animationCallbacks.didEndSaving();
        return '';
      }
      this.edit({ callback: callback });
      // now the editor should again be bound
      expect( this.sandbox.find( 'form' ) ).not.to.exist;
      expect( this.sandbox.data('events' ) ).to.have.ownProperty( 'click' );
      done();
    });
  });

  describe( 'animations during save', function () {

    it( 'should animate during ajax save to server', function ( done ) {
      var complete;
      sinon.stub($, 'ajax', function (options) {
        complete = options.complete;
      });
      this.edit();

      expect( this.sandbox.is(':animated') ).to.be.true;
      eval( complete );
      //expect( this.sandbox.is(':animated') ).to.be.false;
      done();
    });

    it( 'should animate when callbacks are called when submitting to callback', function ( done ) {
      var complete;
      function callback(idOfEditor, enteredText, orinalHTMLContent, settingsParams, animationCallbacks) {
        animationCallbacks.didStartSaving();
        complete = animationCallbacks.didEndSaving;
        return '';
      }
      this.edit({ callback: callback });
      
      expect( this.sandbox.is(':animated') ).to.be.true;
      eval( complete );
      // expect( this.sandbox.is(':animated') ).to.be.false;
      done();
    });

    it( 'should not animate if callbacks are not called when submitting to callback', function ( done ) {
      this.edit({ callback: function() { return ''; }});
      expect( $( this.sandbox ).is(':animated') ).to.be.false;
      done();
    });
  });

  describe( 'submit to callback', function () {

    it( 'shoud call callback on submit', function ( done ) {
      var sensor = false;
      this.edit({ callback:function(){ sensor = true; return ''; }});
      expect( sensor ).to.be.true;
      done();
    });

    it( 'will replace editor with its return value', function( done ){
      this.edit({ callback:function(){ return 'fnord'; } });
      expect( this.sandbox.text() ).to.eq( 'fnord' );
      done();
    });

    it( 'can return 0 from callback', function( done ){
      this.edit({callback:function(){ return 0; }});
      expect( this.sandbox.text() ).to.eq( "0" );
      done();
    });

    it( 'can return empty string from callback', function( done ){
      this.edit({callback:function(){ return ''; }});
      expect( this.sandbox.text() ).to.be.eq( '' );
      done();
    });

    it( 'can skip dom reset after callback', function( done ){
      var sensor = false;
      this.edit({ callback:function(){ sensor = true }, callback_skip_dom_reset:true });
      expect( sensor ).to.be.true;
      expect( this.sandbox.find( 'form' ) ).to.exist;
      done();
    });

    it( 'will not replace editor with its return value', function( done ){
      this.edit({ callback:function(){ return 'fnord' }, callback_skip_dom_reset:true  });
      expect( this.sandbox.text() ).not.to.be.eq( 'fnord' );
      done();
    });
    
    it( 'can replace text from within callback', function( done ){
      this.edit({ callback:function(){ $(this).html('fnord') }, callback_skip_dom_reset:true  });
      expect( this.sandbox.text() ).to.be.eq( 'fnord' );
      done();
    });

  });

  it( 'will ignore multiple attempts to add an inline editor', function( done ){
    this.numberOfHandlers = function() {
      var handlers = this.sandbox.data('events');
      if ( ! handlers)
        return 0;
      var count = 0;
      for (var key in handlers.click)
        count++;
      return count;
    }
    expect( this.numberOfHandlers() ).to.be.eq( 0 );
    this.enableEditor();
    expect( this.numberOfHandlers() ).to.be.eq( 1 );
    this.enableEditor()
    expect( this.numberOfHandlers() ).to.be.eq( 1 );
    done();
  });

  it( 'will not restore ancient view content when escape is triggered after the editor has closed', function( done ){
    sinon.stub( $, "ajax" ).yieldsTo( "success", 'fnord' );
    this.edit({}, 'fnord');
    expect( this.sandbox.text() ).to.be.eq( 'fnord' );
    // try to get the handler to fire even if it shouldn't
    var escape = 27
    $(document).trigger({type:'keyup', which:escape});
    this.sandbox.trigger({type:'keyup', which:escape});
    expect( this.sandbox.text() ).to.be.eq( 'fnord' );
    $.ajax.restore();
    done();
  });

});

describe( 'open editor', function () {

  var originalOpen;

  beforeEach(function() {
    // change additionalOptions to make the sub-editors open their respective widgets
    // this.additionalOptions = { foo: bar }
    
    //if ( ! ('additionalOptions' in this))
    //  throw new Error('You need to assign this.additionalOptions.type to a valid editor type when you include the shared behaviour "open editor"')
    
    originalOpen = this.openEditor;
    sinon.stub( this, 'openEditor', function( options ){
      options = $.extend({}, this.additionalOptions, options);
      return originalOpen.call(this, options);
    });
  });

  afterEach(function () {
    this.openEditor = originalOpen;
  });

  it( 'should restore original content when canceled out of', function( done ){
    this.sandbox.text('fnord');
    this.openEditor().submit();
    expect( this.sandbox.text() ).to.be.eq( 'fnord' );
    done();
  });


  it( 'should present an empty editor if the default text was entered by the editor itself', function( done ){
    this.sandbox = $('<p>');
    this.enableEditor({ default_text: 'fnord' });
    expect( this.sandbox.text() ).to.be.eq( 'fnord' );
    expect( this.sandbox.click().find(':input' ).val() ).to.be.eq( '' );
    // also the second time
    this.sandbox.find(':input').submit();
    expect( this.sandbox.click().find(':input').val() ).to.be.eq( '' );
    // but not when it was changed in the meantime
    this.sandbox.find(':input').submit();
    this.sandbox.text('fnord')
    expect( this.sandbox.click().find(':input' ).val() ).to.be.eq( 'fnord' );
    done();
  });


  it( 'should cancel on submit when no changes where made', function( done ){
    this.openEditor().submit();
    expect( this.sandbox.find( 'form' ) ).not.to.exist;
    done();
  });
  
  it.skip( 'should have "inplace_name" as name and "inplace_field" as class', function( done ){
    var input = this.openEditor();
    console.log( input.html() );
    expect( input.attr( 'name' ) ).to.exist;
    expect( input.attr( 'inplace_value' ) ).to.exist;
    expect( input.hasClass( 'inplace_field' ) ).to.be.true;
    done();
  });

  it.skip( 'should cancel when escape is pressed while focus is in the editor', function( done ){
    var escape = 27;
    this.openEditor().trigger({ type:'keyup', which:escape });
    expect( this.sandbox.find( 'form' ) ).to.exist;
    done();
  });

  it( 'can submit enterd value to function when submitting ', function( done ){
    var sensor = null;
    var options = {
      callback: function(id, enteredText) { return sensor = enteredText; }
    }
    this.edit(options, 'fnord');
    expect( sensor ).to.be.equal( 'fnord' );
    done();
  });
  
  it( 'should not remove content on opening editor if it is identical to the default_text ', function( done ){
    this.sandbox = $('<p>fnord</p>');
    expect( this.openEditor({ default_text:'fnord' }).val() ).to.be.equal( 'fnord' );
    done();
  });

});

describe( 'open editor with arbitrary text input', function () {
  
  it( 'should escape content when inserting text into the editor', function( done ){
    var strangeCharacters = '"<>';
    this.sandbox.text(strangeCharacters);
    expect( this.openEditor().val() ).to.be.equal( strangeCharacters );
    done();
  });

  it( 'should trim content when inserting text into the editor', function( done ){
    this.sandbox.text(' fnord ');
    expect( this.openEditor().val() ).to.be.equal( 'fnord' );
    done();
  });
  
  it( 'should restore content on cancel', function( done ){
    this.sandbox.text('bar');
    this.openEditor({show_buttons: true}).val('foo');
    this.sandbox.find('.inplace_cancel').click();
    expect( this.sandbox.text() ).not.to.include(  'foo' );
    done();
  });

});

describe( 'open editor submitting on enter', function () {
  
  it( 'should cancel when enter is pressed if no changes where made', function( done ){
    var enter = 13
    this.openEditor().trigger({ type: 'keyup', which:enter });
    expect( this.sandbox.find( 'form' ) ).not.to.exist;
    done();
  });

});

describe( 'text', function () {

  it( 'should be the configured type', function( done ){
    this.additionalOptions = { field_type: 'text' };
    var type = this.openEditor().attr( 'type' );
    expect( type ).exist;
    expect( type ).to.be.eq( this.additionalOptions.field_type );
    done();
  });
  
});

describe( 'textarea', function () {

  beforeEach(function(){
    this.additionalOptions = { field_type: 'textarea' };
  });
  
  it.skip( 'should be the configured type', function( done ){
    var output = this.openEditor();
    console.log( "OpenEditor", output.html() );
    expect( output.find( this.additionalOptions.field_type ) ).to.exist;
    done();
  });
  
  it.skip( 'should not submit on enter', function( done ){
    var enter = 13
    this.openEditor().trigger({type:'keyup', which:enter});
    expect( this.sandbox.find( 'form' ) ).to.exist;
    done();
  });

});

describe( 'select', function () {

  it.skip( 'should be the configured type', function( done ){
    this.additionalOptions = { field_type: 'select', select_options: 'fnord'};
    expect( this.openEditor().find( this.additionalOptions.field_type ) ).to.exist;
  });

});