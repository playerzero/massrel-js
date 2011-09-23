describe('UIList', function() {
  it('insert elements', function() {
    var container = $('<div />').hide().appendTo('body');
    var list = new massrel.UIList(container);

    list.append('<div>first</div>');
    expect(container.children().length).toEqual(1);

    // now test ordering
    list.prepend('<div>second</div>');
    list.append('<div>third</div>');

    var children = container.children();
    $.each(['second', 'first', 'third'], function(i, value) {
      expect(children.eq(i).text()).toEqual(value);
    });

    container.remove();
  });

  it('limit number of items', function() {
    var container = $('<div />').hide().appendTo('body');
    var list = new massrel.UIList(container, {
      limit: 1
    });

    list.append('<div>one</div>');
    list.append('<div>two</div>');
    list.append('<div>three</div>');
    list.append('<div>four</div>');

    expect(container.children().size()).toEqual(1);
    expect(container.first().text()).toEqual('four');

    container.remove();
  });
});
