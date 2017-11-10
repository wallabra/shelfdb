// Generated by CoffeeScript 2.0.2
var AbstractClassError, AbstractFunction, AbstractStaticFunction, AbstractionError, BadInheritanceError, absID, abstractClass, isImplementation;

AbstractFunction = (function() {
  var check, constructor;

  class AbstractFunction {};

  constructor = function(name) {
    this.name = name;
  };

  check = (cls) => {
    return cls.prototype[this.name] != null;
  };

  return AbstractFunction;

})();

AbstractStaticFunction = (function() {
  var check;

  class AbstractStaticFunction extends AbstractFunction {};

  check = (cls) => {
    return cls[this.name] != null;
  };

  return AbstractStaticFunction;

})();

AbstractionError = class AbstractionError extends Error {};

AbstractClassError = class AbstractClassError extends AbstractionError {};

BadInheritanceError = class BadInheritanceError extends AbstractionError {};

absID = 0;

abstractClass = function(cls, onApply) {
  var AbstractedClass, k, v;
  AbstractedClass = class AbstractedClass extends cls {
    constructor() {
      throw new AbstractClassError('Can\'t instantiate abstract classes!');
    }

    static apply(otherClass) {
      var k, missingFuncs, v;
      missingFuncs = [];
      for (k in cls) {
        v = cls[k];
        if (v instanceof AbstractFunction && (!v.check(otherClass))) {
          missingFuncs.push(k);
        } else if (v instanceof AbstractStaticFunction) {
          otherClass[k] = v;
        } else if (v instanceof AbstractFunction) {
          otherClass.prototype[k] = v;
        } else if (v != null) {
          otherClass[k] = v;
        }
      }
      if (missingFuncs.length > 0) {
        throw new BadInheritanceError(`Following functions missing in the class definition for ${otherClass.name}, which inherits ${cls.name}: ${issingFuncs.join(' ')}`);
      }
      if (onApply != null) {
        onApply(otherClass);
      }
      otherClass.__implements__ = this.__absID__;
      return otherClass;
    }

  };
  for (k in AbstractedClass) {
    v = AbstractedClass[k];
    if (v == null) {
      AbstractedClass['@abs'][k] = v;
      if (k.startsWith('F_') && k.length > 2) {
        AbstractedClass[k.slice(2)] = new AbstractFunction(k.slice(2));
        delete AbstractedClass[k];
      } else if (k.startsWith('S_') && k.length > 2) {
        AbstractedClass[k.slice(2)] = new AbstractStaticFunction(k.slice(2));
        delete AbstractedClass[k];
      }
    }
  }
  AbstractedClass.__absID__ = absID++;
  if (cls.__absInheritance__ != null) {
    AbstractedClass.__absInheritance__ = cls.__absInheritance__;
    AbstractedClass.__absInheritance__.push(cls);
  } else {
    AbstractedClass.__absInheritance__ = [cls];
  }
  AbstractedClass.name = `${cls.name}_Abstracted`;
  return AbstractedClass;
};

isImplementation = function(ins, cls) {
  return ins.__implements__ === cls.__absID__;
};

module.exports = {
  abstractClass: abstractClass,
  isImplementation: isImplementation,
  AbstractFunction: AbstractFunction,
  AbstractClassError: AbstractClassError,
  BadInheritanceError: BadInheritanceError
};
