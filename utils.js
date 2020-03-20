if (!Function.prototype.bind) {
    Function.prototype.bind = function(obj) {
        var slice = [].slice,
        args  = slice.call(arguments, 1),
        self  = this,
        nop   = function () {},
        bound = function () {
            return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));   
        };
        nop.prototype   = self.prototype;
        bound.prototype = new nop();
        return bound;
    };
}

if (!Object.create) {
    Object.create = function(base) {
        function F() {};
        F.prototype = base;
        return new F();
    }
}

if (!Object.construct) {
    Object.construct = function(base) {
        var instance = Object.create(base);
        if (instance.initialize) {
            instance.initialize.apply(instance, [].slice.call(arguments, 1));
        }
        return instance;
    }
}

if (!Object.extend) {
    Object.extend = function(destination, source) {
        for (var property in source) {
        if (source.hasOwnProperty(property))
            destination[property] = source[property];
        }
        return destination;
    };
}

if (!Array.matrix) {
    Array.matrix = function (m, n, initial) {
        var a, i, j, mat = [];
        for (i = 0; i < m; i += 1) {
            a = [];
            for (j = 0; j < n; j += 1) {
                a[j] = 0;
            }
            mat[i] = a;
        }
        return mat;
    };
}

if (!window.requestAnimationFrame) {
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame;
}