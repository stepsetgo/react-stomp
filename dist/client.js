"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _sockjsClient = _interopRequireDefault(require("sockjs-client"));

var _stompjs = _interopRequireDefault(require("stompjs"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _difference = _interopRequireDefault(require("lodash/difference"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * React component for SockJS-client with STOMP messaging protocol.
 *
 * @version 5.0.0
 * @author [lahsivjar] (https://github.com/lahsivjar)
 * @see {@link https://stomp.github.io/|STOMP}
 * @see {@link https://github.com/sockjs/sockjs-client|StompJS}
 */
var SockJsClient =
/*#__PURE__*/
function (_React$Component) {
  _inherits(SockJsClient, _React$Component);

  function SockJsClient(props) {
    var _this;

    _classCallCheck(this, SockJsClient);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SockJsClient).call(this, props));

    _defineProperty(_assertThisInitialized(_this), "_initStompClient", function () {
      // Websocket held by stompjs can be opened only once
      _this.client = _stompjs["default"].over(new _sockjsClient["default"](_this.props.url, null, _this.props.options));
      _this.client.heartbeat.outgoing = _this.props.heartbeat;
      _this.client.heartbeat.incoming = _this.props.heartbeat;

      if (Object.keys(_this.props).includes('heartbeatIncoming')) {
        _this.client.heartbeat.incoming = _this.props.heartbeatIncoming;
      }

      if (Object.keys(_this.props).includes('heartbeatOutgoing')) {
        _this.client.heartbeat.outgoing = _this.props.heartbeatOutgoing;
      }

      if (!_this.props.debug) {
        _this.client.debug = function () {};
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_cleanUp", function () {
      _this.setState({
        connected: false
      });

      _this.retryCount = 0;

      _this.subscriptions.clear();
    });

    _defineProperty(_assertThisInitialized(_this), "_log", function (msg) {
      if (_this.props.debug) {
        console.log(msg);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_subscribe", function (topic) {
      if (!_this.subscriptions.has(topic)) {
        var subscribeHeaders = Object.assign({}, _this.props.subscribeHeaders);

        var sub = _this.client.subscribe(topic, function (msg) {
          _this.props.onMessage(_this._processMessage(msg.body), msg.headers.destination);
        }, subscribeHeaders);

        _this.subscriptions.set(topic, sub);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_processMessage", function (msgBody) {
      try {
        return JSON.parse(msgBody);
      } catch (e) {
        return msgBody;
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_unsubscribe", function (topic) {
      var sub = _this.subscriptions.get(topic);

      sub.unsubscribe();

      _this.subscriptions["delete"](topic);
    });

    _defineProperty(_assertThisInitialized(_this), "_connect", function () {
      _this._initStompClient();

      _this.client.connect(_this.props.headers, function () {
        _this.setState({
          connected: true
        });

        _this.props.topics.forEach(function (topic) {
          _this._subscribe(topic);
        });

        _this.props.onConnect();
      }, function (error) {
        if (error) {
          if (Object.keys(_this.props).includes('onConnectFailure')) {
            _this.props.onConnectFailure(error);
          } else {
            _this._log(error.stack);
          }
        }

        if (_this.state.connected) {
          _this._cleanUp(); // onDisconnect should be called only once per connect


          _this.props.onDisconnect();
        }

        if (_this.props.autoReconnect && !_this.state.explicitDisconnect) {
          _this._timeoutId = setTimeout(_this._connect, _this.props.getRetryInterval(_this.retryCount++));
        }
      });
    });

    _defineProperty(_assertThisInitialized(_this), "connect", function () {
      _this.setState({
        explicitDisconnect: false
      });

      if (!_this.state.connected) {
        _this._connect();
      }
    });

    _defineProperty(_assertThisInitialized(_this), "disconnect", function () {
      // On calling disconnect explicitly no effort will be made to reconnect
      // Clear timeoutId in case the component is trying to reconnect
      if (_this._timeoutId) {
        clearTimeout(_this._timeoutId);
        _this._timeoutId = null;
      }

      _this.setState({
        explicitDisconnect: true
      });

      if (_this.state.connected) {
        _this.subscriptions.forEach(function (subid, topic) {
          _this._unsubscribe(topic);
        });

        _this.client.disconnect(function () {
          _this._cleanUp();

          _this.props.onDisconnect();

          _this._log('Stomp client is successfully disconnected!');
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "sendMessage", function (topic, msg) {
      var optHeaders = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (_this.state.connected) {
        _this.client.send(topic, optHeaders, msg);
      } else {
        throw new Error('Send error: SockJsClient is disconnected');
      }
    });

    _this.state = {
      connected: false,
      // False if disconnect method is called without a subsequent connect
      explicitDisconnect: false
    };
    _this.subscriptions = new Map();
    _this.retryCount = 0;
    return _this;
  }

  _createClass(SockJsClient, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this._connect();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.disconnect();
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      return false;
    }
    /* eslint camelcase: ["error", {allow: ["UNSAFE_componentWillReceiveProps"]}] */

  }, {
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(nextProps) {
      var _this2 = this;

      if (this.state.connected) {
        // Subscribe to new topics
        (0, _difference["default"])(nextProps.topics, this.props.topics).forEach(function (newTopic) {
          _this2._log('Subscribing to topic: ' + newTopic);

          _this2._subscribe(newTopic);
        }); // Unsubscribe from old topics

        (0, _difference["default"])(this.props.topics, nextProps.topics).forEach(function (oldTopic) {
          _this2._log('Unsubscribing from topic: ' + oldTopic);

          _this2._unsubscribe(oldTopic);
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      return null;
    }
  }]);

  return SockJsClient;
}(_react["default"].Component);

_defineProperty(SockJsClient, "defaultProps", {
  onConnect: function onConnect() {},
  onDisconnect: function onDisconnect() {},
  getRetryInterval: function getRetryInterval(count) {
    return 1000 * count;
  },
  options: {},
  headers: {},
  subscribeHeaders: {},
  autoReconnect: true,
  debug: false,
  heartbeat: 10000
});

_defineProperty(SockJsClient, "propTypes", {
  /**
   * HTTP URL of the endpoint to connect.
   */
  url: _propTypes["default"].string.isRequired,

  /**
   * Additional options to pass to the underlying SockJS constructor.
   *
   * @see [SockJS-options](https://github.com/sockjs/sockjs-client#sockjs-client-api)
   */
  options: _propTypes["default"].object,

  /**
   * Array of topics to subscribe to.
   */
  topics: _propTypes["default"].array.isRequired,

  /**
   * Callback after connection is established.
   */
  onConnect: _propTypes["default"].func,

  /**
   * Callback after connection is lost.
   */
  onDisconnect: _propTypes["default"].func,

  /**
   * Gets called to find the time interval for next retry. Defaults to a function returing retryCount seconds.
   *
   * @param {number} retryCount number of retries for the current disconnect
   */
  getRetryInterval: _propTypes["default"].func,

  /**
   * Callback when a message is recieved.
   *
   * @param {(string|Object)} msg message received from server, if JSON format then object
   * @param {string} topic the topic on which the message was received
   */
  onMessage: _propTypes["default"].func.isRequired,

  /**
   * Headers that will be passed to the server or broker with STOMP's connection frame.
   */
  headers: _propTypes["default"].object,

  /**
   * Headers that will be passed when subscribing to a destination.
   */
  subscribeHeaders: _propTypes["default"].object,

  /**
   * Should the client try to automatically connect in an event of disconnection.
   */
  autoReconnect: _propTypes["default"].bool,

  /**
   * Enable debugging mode.
   */
  debug: _propTypes["default"].bool,

  /**
   * Number of milliseconds to send and expect heartbeat messages.
   */
  heartbeat: _propTypes["default"].number,

  /**
   * Number of milliseconds to expect heartbeat messages
   */
  heartbeatIncoming: _propTypes["default"].number,

  /**
   * Number of milliseconds to send heartbeat messages
   */
  heartbeatOutgoing: _propTypes["default"].number,

  /**
   * Callback if connection could not be established
   */
  onConnectFailure: _propTypes["default"].func
});

var _default = SockJsClient;
exports["default"] = _default;