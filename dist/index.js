"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "reactReduxFirebase", {
  enumerable: true,
  get: function get() {
    return _reactReduxFirebase.reactReduxFirebase;
  }
});
Object.defineProperty(exports, "firebaseStateReducer", {
  enumerable: true,
  get: function get() {
    return _reactReduxFirebase.firebaseStateReducer;
  }
});
Object.defineProperty(exports, "getFirebase", {
  enumerable: true,
  get: function get() {
    return _reactReduxFirebase.getFirebase;
  }
});
exports.firebaseConnect = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _isEqual = _interopRequireDefault(require("lodash/isEqual"));

var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));

var _reactReduxFirebase = require("react-redux-firebase");

var _query = require("react-redux-firebase/lib/actions/query");

var _utils = require("react-redux-firebase/lib/utils");

var _getEventsFromInput = function _getEventsFromInput(data) {
  var inputs = [];

  if (!data) {
    return inputs;
  }

  Object.keys(data).forEach(function (key) {
    var _data$key = data[key],
        path = _data$key.path,
        listeners = _data$key.listeners;
    listeners.forEach(function (listener) {
      inputs.push({
        path: path,
        queryParams: listener
      });
    });
  });
  return (0, _utils.getEventsFromInput)(inputs);
};

var getDisplayName = function getDisplayName(Component) {
  return Component.displayName || Component.name || (typeof Component === 'string' ? Component : 'Component');
};

var firebaseConnect = function firebaseConnect() {
  var dataOrFn = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var connect = arguments.length > 1 ? arguments[1] : undefined;
  return function (WrappedComponent) {
    var connectListeners = {};

    var FirebaseConnect =
    /*#__PURE__*/
    function (_PureComponent) {
      (0, _inherits2.default)(FirebaseConnect, _PureComponent);

      function FirebaseConnect(props, context) {
        var _this;

        (0, _classCallCheck2.default)(this, FirebaseConnect);
        var firebase = context.store.firebase;
        _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(FirebaseConnect).call(this));
        (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "firebaseEvents", []);
        (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "firebase", null);
        (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "prevData", null);
        (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "getUpdatedEvents", function (data) {
          var newFirebaseEvents = _getEventsFromInput(data);

          var oldFirebaseEvents = _this.firebaseEvents;
          var addedEvents = [];
          var removedEvents = oldFirebaseEvents;
          newFirebaseEvents.forEach(function (newEvent) {
            var newQueryId = newEvent.queryId;
            var isEventExists = oldFirebaseEvents.some(function (_ref) {
              var queryId = _ref.queryId;
              return queryId === newQueryId;
            });

            if (isEventExists) {
              removedEvents = removedEvents.filter(function (_ref2) {
                var queryId = _ref2.queryId;
                return queryId !== newQueryId;
              });
            } else {
              addedEvents.push(newEvent);
            }
          });
          return {
            addedEvents: addedEvents,
            removedEvents: removedEvents
          };
        });
        (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "getStateProps", function (_prevData) {
          var getState = _this.context.store.getState;
          var state = getState();
          var stateProps = {};
          var prevData = _prevData || _this.prevData;
          Object.keys(prevData).forEach(function (propName) {
            var _prevData$propName = prevData[propName],
                path = _prevData$propName.path,
                defaultValue = _prevData$propName.defaultValue;
            var resolvedPropValue = (0, _reactReduxFirebase.dataToJS)(state.firebase, path);

            connectListeners[propName] = function (state) {
              return (0, _reactReduxFirebase.dataToJS)(state.firebase, path);
            };

            var loadedPropName = "isLoaded".concat(propName[0].toUpperCase()).concat(propName.substr(1));
            var isLoadedPropValue = stateProps[loadedPropName] || (0, _reactReduxFirebase.isLoaded)(resolvedPropValue);
            var oldStateProp = _this.state && _this.state[path] && _this.state[path].value;
            var canMerge = (0, _typeof2.default)(oldStateProp) === 'object' && (0, _typeof2.default)(resolvedPropValue) === 'object';

            if (defaultValue && !isLoadedPropValue) {
              resolvedPropValue = typeof defaultValue === 'function' ? defaultValue(state) : typeof defaultValue === 'string' && /\./.test(defaultValue) ? [state].concat(defaultValue.split('.')).reduce(function (a, b) {
                return a[b];
              }) : defaultValue;
              isLoadedPropValue = Boolean(resolvedPropValue);
            }

            stateProps.propsToPaths = (0, _objectSpread3.default)({}, stateProps.propsToPaths, (0, _defineProperty2.default)({}, propName, path));
            stateProps[path] = {
              isLoaded: isLoadedPropValue,
              value: canMerge ? (0, _objectSpread3.default)({}, oldStateProp, resolvedPropValue) : resolvedPropValue
            };
          });
          return stateProps;
        });
        var inputAsFunc = (0, _utils.createCallable)(dataOrFn);

        var _prevData2 = inputAsFunc(props, firebase);

        _this.prevData = _prevData2;
        _this.context = context;
        _this.state = _this.getStateProps(_prevData2);
        return _this;
      }

      (0, _createClass2.default)(FirebaseConnect, [{
        key: "componentWillMount",
        value: function componentWillMount() {
          var firebase = this.context.store.firebase;

          if (firebase) {
            var ref = firebase.ref,
                helpers = firebase.helpers,
                storage = firebase.storage,
                database = firebase.database,
                auth = firebase.auth;
            this.firebase = (0, _objectSpread3.default)({
              ref: ref,
              storage: storage,
              database: database,
              auth: auth
            }, helpers);
            this.firebaseEvents = _getEventsFromInput(this.prevData);
          }
        }
      }, {
        key: "componentDidMount",
        value: function componentDidMount() {
          var _this$context$store = this.context.store,
              firebase = _this$context$store.firebase,
              dispatch = _this$context$store.dispatch;

          if (firebase) {
            (0, _query.watchEvents)(firebase, dispatch, this.firebaseEvents);
          }
        }
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          var _this$context$store2 = this.context.store,
              firebase = _this$context$store2.firebase,
              dispatch = _this$context$store2.dispatch;
          (0, _query.unWatchEvents)(firebase, dispatch, this.firebaseEvents);
        }
      }, {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(props) {
          var _this$context$store3 = this.context.store,
              firebase = _this$context$store3.firebase,
              dispatch = _this$context$store3.dispatch;
          var inputAsFunc = (0, _utils.createCallable)(dataOrFn);
          var data = inputAsFunc(props, firebase);

          var _this$getUpdatedEvent = this.getUpdatedEvents(data),
              addedEvents = _this$getUpdatedEvent.addedEvents,
              removedEvents = _this$getUpdatedEvent.removedEvents;

          var stateProps = this.getStateProps(data);

          if (addedEvents.length || removedEvents.length) {
            this.prevData = data;
            (0, _query.unWatchEvents)(firebase, dispatch, this.firebaseEvents);
            this.firebaseEvents = _getEventsFromInput(data);
            (0, _query.watchEvents)(firebase, dispatch, this.firebaseEvents);
          }

          if (!(0, _isEqual.default)(stateProps, this.state)) {
            this.setState(stateProps);
          }
        }
      }, {
        key: "render",
        value: function render() {
          var _this2 = this;

          var propsToPaths = this.state.propsToPaths;
          var modifiedState = {};
          Object.keys(propsToPaths).forEach(function (prop) {
            var state = _this2.state;
            var path = propsToPaths[prop];
            var modifyResult = _this2.prevData[prop] && _this2.prevData[prop].modifyResult;
            var loadedPropName = "isLoaded".concat(prop[0].toUpperCase()).concat(prop.substr(1));
            modifiedState[loadedPropName] = state[path].isLoaded;
            modifiedState[prop] = typeof modifyResult === 'function' ? modifyResult(state[path].value) : state[path].value;
          });
          return _react.default.createElement(WrappedComponent, (0, _extends2.default)({}, this.props, modifiedState));
        }
      }]);
      return FirebaseConnect;
    }(_react.PureComponent);

    (0, _defineProperty2.default)(FirebaseConnect, "contextTypes", {
      store: _propTypes.default.object.isRequired
    });
    (0, _defineProperty2.default)(FirebaseConnect, "displayName", "FirebaseConnect(".concat(getDisplayName(WrappedComponent), ")"));
    (0, _defineProperty2.default)(FirebaseConnect, "wrappedComponent", WrappedComponent);
    var component = (0, _hoistNonReactStatics.default)(FirebaseConnect, WrappedComponent);

    if (!connect) {
      return component;
    }

    return connect(connectListeners)(component);
  };
};

exports.firebaseConnect = firebaseConnect;