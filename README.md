ascot
======

A minimalist DOM manipulation and controller library. Allows for a convenient ExpressJS-like syntax for working with the DOM, helping create more "symmetric" code between server-side and client-side JavaScript.

## Background

The JavaScript ecosystem is marked by an abundance of client-side frameworks with many features. Large multi-featured libraries such as jQuery introduce a great deal of unused code--it is not uncommon for web apps to utilize only small portions of library code that is still included in the application payload. The maturation of package management systems such as [Bower](http://bower.io/) and [npm](https://npmjs.org/) has made it simple to incorporate smaller component libraries or even single-feature utilities in to application code.

Ascot was created to provide a simple syntax for architecting web apps. While the library is "MVC" in spirit, it contains no models or views. Its focus is only to introduce functional, re-useable components in to the DOM in a standard way.

## Installation

```
npm install rvangundy/ascot2 --save
```

## Usage

The ascot library is intended for use on the client-side using [browserify](https://github.com/substack/node-browserify). The package returns a function used to instantiate an ascot context.

```javascript
var ascot = require('ascot2');

var app = ascot(document.body).use( /* application code here */);
```

## Examples

### Example 1 : Build a simple DOM form

Let's build a simple form where a user can enter basic information.

```javascript
var app = ascot(document.body).add('<form></form>', function(el) {
    ascot(el).add('<label>Username</label>')
             .add('<input type="text" name="firstname">')
             .add('<label>Password</label>')
             .add('<input type="text" name="lastname">')
             .add('<input type="submit" value="submit">');
});
```

This example illustrates the ability to append elements through nested functions. If the goal was only to create a simple HTML form, the above seems cumbersome. Let's add some functionality to make the form do something more interesting.

```javascript
function checkUsername(el) {
    el.addEventListener('
});

var app = ascot(document.body).add('<form></form>', function(el) {
    ascot(el).add('<label>Username</label>')
             .add('<input type="text" name="username">')
             .add('<label>Password</label>')
             .add('<input type="text" name="password">')
             .add('<input type="submit" value="submit">');
});
```


