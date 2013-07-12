describe( 'default settings', function () {
  
  it( 'should throw if neither url nor callback option is set', function ( done ) {
    var expectedMessage = "Need to set either url: or callback: option for the inline editor to work.";
    var that = this;
    var fn = function () { that.sandbox.editInPlace() };
    expect( fn ).to.throw( Error, expectedMessage );
    done();
  });

  it( 'can convert tag to editor', function ( done ) {
    this.openEditor();
    expect( this.sandbox.find( "input" ) ).to.exist;
    done();
  });

  it( 'leaves out buttons by default', function ( done ) {
    this.openEditor();
    expect( this.sandbox.find( "button" ) ).not.to.exist;
    done();
  });

  it( 'uses text as default field type', function ( done ) {
    this.openEditor();
    expect( this.sandbox.find( 'input[type="text"]' ) ).to.exist;
    done();
  });

  it( 'will hover to yellow', function ( done ) {
    expect( this.enableEditor().mouseover().css('background-color') ).to.eq( 'rgb(255, 255, 204)' );
    expect( this.sandbox.mouseout().css('background-color') ).to.equal( 'transparent' );
    done();
  });

  it( 'should show "click here to add text" if element is empty', function ( done ) {
    this.sandbox = $('<p>');
    expect( this.enableEditor().text() ).to.eq( "(Click here to add text)" );
    done();
  });

  it( 'will size textareas 25x10 by default', function ( done ) {
    var textarea = this.openEditor({field_type:'textarea'});
    expect( textarea.attr('cols') ).to.be.eq( 25 );
    expect( textarea.attr('rows') ).to.be.eq( 10 );
    done();
  });

  describe( 'ajax submissions', function () {
    
    beforeEach(function(){
      var that = this;
      that.url = undefined;
      sinon.stub($, 'ajax', function (options) {
        that.url = options.data;
      });
      jQuery.fx.off = true;
    });

    afterEach(function(){
      jQuery.ajax.restore(); // Unwraps the spy
      jQuery.fx.off = false;
    });

    it( 'will submit id of original element as element_id', function ( done ) {
      this.sandbox.attr('id', 'fnord');
      this.edit({});
      expect( this.url ).to.include( 'element_id=fnord' );
      done();
    });

    it( 'will submit content of editor as update_value', function ( done ) {
      this.edit({}, 'fnord');
      expect( this.url ).to.include( 'update_value=fnord' );
      done();
    });

    it( 'will submit original html with key original_html', function ( done ) {
      this.sandbox.text('fnord');
      this.edit({}, 'foo');
      expect( this.url ).to.include( 'original_html=fnord' );
      done();
    });

    it( 'will url encode entered text', function ( done ) {
      this.edit({}, '%&=/<>');
      expect( this.url ).to.include( 'update_value=%25%26%3D%2F%3C%3E' );
      done();
    });

    it( 'will url encode original html correctly', function ( done ) {
      this.sandbox.html('<p onclick="\"%&=/<>\"">');
      var expectedURLPart = encodeURIComponent(this.sandbox.html());
      this.edit({use_html:true});
      expect( this.url ).to.include( 'original_html=' + expectedURLPart );
      done();
    });

    it( 'should not loose the param option on the second submit', function ( done ) {
      var editor = this.openEditor({params: 'foo=bar'});
      this.edit();
      expect( this.url ).to.include( 'foo=bar' );
      editor.click().find(':input').val(23).submit();
      expect( this.url ).to.include( 'foo=bar' );
      done();
    });

    it( 'will submit on blur', function ( done ) {
      this.openEditor().val('fnord').blur();
      expect( this.url ).not.to.be.null;
      done();
    });
  });

  it( 'should not trigger submit if nothing was changed', function ( done ) {
    this.openEditor().submit();
    done();
  });

  
  it( 'should not think that it has placed the default text in the editor if its content is changed from somewhere else', function ( done ) {
    this.sandbox = $('<p></p>');
    this.enableEditor().text('fnord');
    expect( this.sandbox.click().find(':input').val() ).to.be.equal( 'fnord' );
    done();
  });

  describe( 'editor value interaction should use .text() to', function () {
    
    beforeEach(function(){
      this.sandbox.html('fno<span>rd</span>')
    });

    it( 'extract value from editor by default', function ( done ) {
      expect( this.openEditor().val() ).to.eq( 'fnord' );
      done();
    });

    it( 'restore content after cancel', function ( done ) {
      this.openEditor().submit();
      // cancel editor
      expect( this.sandbox.data('events' ) ).to.have.ownProperty( 'click' );
      expect( this.sandbox.find( 'span' ) ).not.to.exist;
      done();
    });


    it( 'send to callback as third argument', function ( done ) {
      var thirdArgument;
      var options = {
        callback:function(){
          thirdArgument = arguments[2];
          return '';
        }
      };
      this.edit(options);
      expect( thirdArgument ).to.equal( 'fnord' );
      done();
    });

    it( 'restore editor DOM after failed callback call', function ( done ) {
      this.edit({
        callback:function(){},
        error_sink:function(){}
      });
      expect( this.sandbox.find( 'span' ) ).not.to.be.null;
      done();
    });
    
    it( 'send to server via ajax-request', function ( done ) {
      var data
      sinon.stub($, 'ajax', function (options) {
          data = options.data;
      });
      this.edit();
      expect( data ).to.match( /original_value=fnord/ );
      jQuery.ajax.restore(); // Unwraps the spy
      done();
    });
  });

})
