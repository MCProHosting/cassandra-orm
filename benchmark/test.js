function rand (len) {
    var out = '';
    var chars = 'qwertyuiopasdfghjklzxcvbnm';
    for (; len > 0; len--) {
        out += chars[~~(Math.random() * chars.length)];
    }

    return out;
}
function gen (num) {
    var out = { a: 1 };
    for (; num > 0; num--) {
        out[rand(20)] = rand(20);
    }

    return out;
}

var fast100 = gen(100);
var fast1000 = gen(1000);
var fast10000 = gen(10000);

var slow100 = gen(100);
var slow1000 = gen(1000);
var slow10000 = gen(10000);
delete slow100.a;
delete slow1000.a;
delete slow10000.a;

new (require('benchmark').Suite)()
    .add('100 enumerate fast', function () {
        Object.keys(fast100);
    })
    .add('1000 enumerate fast', function () {
        Object.keys(fast1000);
    })
    .add('10000 enumerate fast', function () {
        Object.keys(fast10000);
    })
    .add('100 enumerate slow', function () {
        Object.keys(slow100);
    })
    .add('1000 enumerate slow', function () {
        Object.keys(slow1000);
    })
    .add('10000 enumerate slow', function () {
        Object.keys(slow10000);
    })
    .add('100 lookup fast', function () {
        var i = fast100.a;
    })
    .add('1000 lookup fast', function () {
        var i = fast1000.a;
    })
    .add('10000 lookup fast', function () {
        var i = fast10000.a;
    })
    .add('100 lookup slow', function () {
        var i = slow100.a;
    })
    .add('1000 lookup slow', function () {
        var i = slow1000.a;
    })
    .add('10000 lookup slow', function () {
        var i = slow10000.a;
    })
    .add('100 set fast', function () {
        fast100.a = 'b';
    })
    .add('1000 set fast', function () {
        fast1000.a = 'b';
    })
    .add('10000 set fast', function () {
        fast10000.a = 'b';
    })
    .add('100 set slow', function () {
        slow100.a = 'b';
    })
    .add('1000 set slow', function () {
        slow1000.a = 'b';
    })
    .add('10000 set slow', function () {
        slow10000.a = 'b';
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .run();
