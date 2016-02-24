"use strict";

//
var React = require('react'),
    Router = require('react-router'),
    { Route, NotFoundRoute, DefaultRoute } = Router;

//
var App = require('./app.jsx'),
    Home = require('./modules/home/home.jsx');

//
var Client = require('./libs/remote-device/client.js');
window.onunload = function () {
    Client.destroy();
};

//
var routes = (
    <Route handler={App} path="/">
        <DefaultRoute handler={Home} />
        //
        <NotFoundRoute handler={Home} />
    </Route>
);

//
document.addEventListener('DOMContentLoaded', function () {
    Router.run(routes, function (Handler, state) {
        //
        React.render(<Handler />, document.body);            
    });
});
