import React from 'react';

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var _ref =
/*#__PURE__*/
React.createElement("defs", null, React.createElement("style", null));

var _ref2 =
/*#__PURE__*/
React.createElement("path", {
  d: "M656 512h160c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H656c-8.8 0-16 7.2-16 16v22H346V320h86c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h86v378c0 17.7 14.3 32 32 32h314v22c0 8.8 7.2 16 16 16h160c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H656c-8.8 0-16 7.2-16 16v22H346V474h294v22c0 8.8 7.2 16 16 16z"
});

var SvgMenu = function SvgMenu(props) {
  return React.createElement("svg", _extends({
    className: "menu_svg__icon",
    viewBox: "0 0 1024 1024",
    width: 200,
    height: 200
  }, props), _ref, _ref2);
};

console.log(React.createElement(SvgMenu, null));
