// Generated by CoffeeScript 1.12.6
var DBSerializable, Database, DatabaseSerializer, JSONSerializer, YAML, YAMLSerializer, _serTypes, abstractClass, fs, isImplementation, ref,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fs = require('fs');

YAML = require('js-yaml');

ref = require('./abstraction.js'), abstractClass = ref.abstractClass, isImplementation = ref.isImplementation;

DatabaseSerializer = (function() {
  function DatabaseSerializer() {}

  DatabaseSerializer.prototype.F_serialize = null;

  DatabaseSerializer.prototype.F_deserialize = null;

  return DatabaseSerializer;

})();

DatabaseSerializer = abstractClass(DatabaseSerializer, function(cls) {
  return cls.database = function(filename) {
    return new Database(filename, cls);
  };
});

YAMLSerializer = (function() {
  function YAMLSerializer() {}

  YAMLSerializer.prototype.serialize = function(o) {
    return YAML.safeDump(o, {
      indent: 4,
      lineWidth: 175
    });
  };

  YAMLSerializer.prototype.deserialize = YAML.safeLoad;

  return YAMLSerializer;

})();

JSONSerializer = (function() {
  var deserialize;

  function JSONSerializer() {}

  JSONSerializer.prototype.serialize = JSON.parse;

  deserialize = JSON.parse;

  return JSONSerializer;

})();

YAMLSerializer = DatabaseSerializer.apply(YAMLSerializer);

JSONSerializer = DatabaseSerializer.apply(JSONSerializer);

_serTypes = {};

DBSerializable = (function() {
  function DBSerializable() {}

  DBSerializable.prototype.F_toObject = null;

  DBSerializable.prototype.S_fromObject = null;

  return DBSerializable;

})();

DBSerializable = abstractClass(DBSerializable, function(cls) {
  return _serTypes[cls.name] = cls;
});

Database = (function() {
  function Database(filename1, serializer) {
    var err;
    this.filename = filename1;
    this.serializer = serializer;
    this.append = bind(this.append, this);
    this.get = bind(this.get, this);
    this.put = bind(this.put, this);
    this.serialize = bind(this.serialize, this);
    this.save = bind(this.save, this);
    this.load = bind(this.load, this);
    this._loadFile = bind(this._loadFile, this);
    this.unfreeze = bind(this.unfreeze, this);
    this.objectFrom = bind(this.objectFrom, this);
    try {
      if (fs.statSync(this.filename).isFile()) {
        this.data = this.serializer.deserialize(fs.readFileSync(this.filename));
      } else {
        throw new Error("If you are seeing this, something is wrong with this control block.");
      }
    } catch (error) {
      err = error;
      this.data = {};
    }
    if ((typeof this.serializer) === 'function') {
      this.serializer = new this.serializer();
    }
  }

  Database.prototype.objectFrom = function(obj) {
    var k, ref1, res, v;
    res = {
      spec: {
        serialization: null,
        type: null,
        primitive: false
      },
      obj: null
    };
    if (isImplementation(obj, DBSerializable)) {
      res.obj = obj.toObject();
      res.spec.type = "DBSerializable";
      res.spec.serialization = obj.constructor.name;
    }
    if (typeof obj !== 'object') {
      if ((ref1 = typeof obj) !== 'string' && ref1 !== 'number' && ref1 !== 'array' && ref1 !== 'boolean') {
        throw new Error(obj + " must be a subclass of abstract type DBSerializable! (use DBSerializable.apply(myClass) if obj is an instance of myClass and myClassi implements such methods)");
      } else {
        res.obj = obj;
        res.spec.type = typeof obj;
        res.spec.primitive = true;
      }
    } else if (obj === null) {
      res.obj = obj;
      res.spec.primitive = true;
    } else {
      if (res.spec.type == null) {
        res.spec.type = "object";
      }
      res.obj = {};
      for (k in obj) {
        v = obj[k];
        res.obj[k] = this.objectFrom(v);
      }
    }
    return res;
  };

  Database.prototype.unfreeze = function(d) {
    var k, o, ref1, res, v;
    res = null;
    if (d.spec.type === "DBSerializable") {
      if (d.spec.serialization != null) {
        d.obj = _serTypes[d.spec.serialization].fromObject(d.obj);
      } else {
        throw new Error("DBSerializable-based object '" + d.obj + "' does not specify the serializing class in its spec structure");
      }
    } else if (d.spec.primitive) {
      res = d.obj;
    } else if (d.spec.type === "object") {
      o = {};
      ref1 = d.obj;
      for (k in ref1) {
        v = ref1[k];
        o[k] = this.unfreeze(v);
      }
      res = o;
    } else {
      throw new Error("Object '" + d.obj + "' does not specify a supported spec structure type ('" + d.spec.type + "' is a currently unsupported format)");
    }
    return res;
  };

  Database.prototype._loadFile = function() {
    var data, err;
    try {
      if (!fs.statSync(this.filename).isFile()) {
        throw new Error("If you are seeing this, something is wrong with this control block.");
      }
    } catch (error) {
      err = error;
      return this.data || {};
    }
    data = this.serializer.deserialize(fs.readFileSync(this.filename));
    return this.unfreeze(data);
  };

  Database.prototype.load = function() {
    return this.data = this._loadFile();
  };

  Database.prototype.save = function() {
    return fs.writeFileSync(this.filename, this.serialize(this.data));
  };

  Database.prototype.serialize = function(obj) {
    return this.serializer.serialize(this.objectFrom(obj));
  };

  Database.prototype.parsePath = function(path, separator) {
    if ((typeof path) === "string") {
      path = path.match(new RegExp("(?:\\\\.|[^\\" + separator[0] + "])+", 'g')).map(function(x) {
        return x.split("\\.").join(".");
      });
    }
    return path;
  };

  Database.prototype.put = function(path, value, separator, obj) {
    var first;
    if (separator == null) {
      separator = '.';
    }
    path = this.parsePath(path, separator);
    first = false;
    if (obj == null) {
      this.load();
      first = true;
      obj = this.data;
    }
    if (path.length > 1) {
      if (obj[path[0]] == null) {
        obj[path[0]] = {};
      }
      obj[path[0]] = this.put(path.slice(1), value, separator, obj[path[0]]);
    } else {
      obj[path[0]] = value;
    }
    if (first) {
      this.data = obj;
      this.save();
      return path.map(function(x) {
        return x.split('.').join('\\.');
      }).join(".");
    } else {
      return obj;
    }
  };

  Database.prototype.get = function(path, separator) {
    var i, len, o, p;
    this.load();
    path = this.parsePath(path, separator);
    o = this.data;
    for (i = 0, len = path.length; i < len; i++) {
      p = path[i];
      if (o[p] == null) {
        return null;
      }
      o = o[p];
    }
    return o;
  };

  Database.prototype.append = function(path, value, separator) {
    var o;
    if (separator == null) {
      separator = '.';
    }
    o = this.get(path, separator);
    if (typeof o !== "array") {
      return null;
    }
    o.push(value);
    return this.put(path, o, separator);
  };

  return Database;

})();

module.exports = {
  DBSerializable: DBSerializable,
  Database: Database,
  DatabaseSerializer: DatabaseSerializer,
  JSONSerializer: JSONSerializer,
  YAMLSerializer: YAMLSerializer,
  abstractClass: abstractClass,
  isImplementation: isImplementation
};
