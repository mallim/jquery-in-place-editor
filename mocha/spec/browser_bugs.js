// all of these should execute in all browsers if at all possible, to make sure none of them gets
// bugged out due to the added behaviour.
describe( 'browser specific behaviour', function () {

  it( "should send other in place editors blur event when the new one gets focus", function ( done ) {
    this.sandbox = $('<div><p/><p/></div>');
    this.sandbox.find('p').editInPlace({url:'fnord'});
    // open both editors at the same time
    this.sandbox.find('p:first').click();
    this.sandbox.find('p:last').click();
    expect( this.sandbox.find(':input' ).length ).to.eq( 1 );
    expect( this.sandbox.attr( "p:last :input" ) ).not.to.be.null;
    done();
  });

  it( "ie and firefox do not commit a form if it contains no button", function ( done ) {
    var enter = 13
    this.openEditor().trigger({ type: 'keyup', which:enter });
    expect( this.sandbox.attr( "form" ) ).to.be.undefined;
    done();
  });

  it.skip(  'webkit nightlies should commit on enter', function ( done ) {
    var enter = 13;
    this.openEditor().val('fnord').trigger({ type:'keyup', which:enter});
    // expect( this.sandbox.attr( "form" ) ).to.be.undefined;
    // this.sandbox.should.have_text 'fnord'
    // console.log( "this.sandbox.text=", this.sandbox.text() );
    // expect( this.sandbox.text() ).to.eq( 'fnord' );
    done();
  });
});

