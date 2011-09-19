describe('Account', function() {
  var user = 'howardrauscher';

  it('create instance of Account', function() {
    var account = new massrel.Account(user);
    expect(account.user).toEqual(user);
  });

  it('user name should be used when coerced into string', function() {
    var account = new massrel.Account(user);
    expect(String(account)).toEqual(user);
    expect(''+account).toEqual(user);
  });

  it('use correct RESTful urls', function() {
    var account = new massrel.Account(user);
    expect(account.meta_url()).toEqual('http://tweetriver.com/howardrauscher.json');
  });

  //TODO: #meta

});
