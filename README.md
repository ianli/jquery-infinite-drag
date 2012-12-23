# jQuery Infinite Drag

Version 0.1

Infinite Drag is a jQuery plugin that helps you create an infinite wall interface. As you drag the wall in a viewport, previously occluded tiles are created. You can hook onto events to generate custom tiles.

jQuery Infinite Drag requires these Javascript libraries: jQuery and jQuery UI.

http://ianli.com/infinitedrag

Copyright (c) 2010 Ian Li (http://ianli.com)

## Licence 

Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.

## Triggering redraw on jQuery.animate

If you change the offset of the viewport you will need to trigger a window.resize event in order to get the tiles to redraw. This can be done as follows:

```javascript
$(window).resize();
var evt = document.createEvent('UIEvents');
evt.initUIEvent('resize', true, true, window, 1);
window.dispatchEvent(evt);
```
