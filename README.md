# jQuery Infinite Drag

Infinite Drag is a jQuery plugin that helps you create an infinite wall interface. As you drag the wall in a viewport, previously occluded tiles are created. You can hook onto events to generate custom tiles.

jQuery Infinite Drag requires these Javascript libraries:
* jQuery
* jQuery UI or jquery.pep.js

##Minimal setup

```html
   <script src="//code.jquery.com/jquery-1.10.2.js"></script>
   <script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
   <script src="jquery.infinitedrag.js" type="text/javascript"></script>
   <script type="text/javascript">
      (function( $ ) {
         $(function(){
            $.infinitedrag("#InfiniteDrag .content", {}, {});
         })
      })( jQuery );
   </script>
   <div id="InfiniteDrag" style="overflow:hidden;">
      <div class="content"></div>
   </div>
```

##Options

###class_name

The class given to all the created div.

###width and height

The size (in pixel) of each tile. Defaults to 100x100 pixels tiles.

###start_col and start_row

The coordinate of the top left tile. Defaults to (0,0).

###range_col and range_row

The maximum and minimum tile that will be created on both axis. By default the viewport can be scrolled by 1 000 000 tiles each direction.

```html
   <script src="//code.jquery.com/jquery-1.10.2.js"></script>
   <script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
   <script src="jquery.infinitedrag.js" type="text/javascript"></script>
   <script type="text/javascript">
      (function( $ ) {
         $(function(){
            //create a 10x10 wall.
            $.infinitedrag("#InfiniteDrag .content", {}, {
               range_col : [0,9],
               range_row : [0,9]
            });
         })
      })( jQuery );
   </script>
   <div id="InfiniteDrag" style="overflow:hidden;background:#cccccc;width:400px;height:400px">
      <div class="content"></div>
   </div>
```

###margin
A margin of 10 will create 10 tiles in each direction around the viewport. This comes in very handy when creating tiles is an expensive operation and you want smooth scrolling. Defaults to 0.

###oncreate
Callback called on the creation of a tile to add the tile content. By default there is a callback outputting the tile coordinate.

```html
   <script src="//code.jquery.com/jquery-1.10.2.js"></script>
   <script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
   <script src="jquery.infinitedrag.js" type="text/javascript"></script>
   <script type="text/javascript">
      (function( $ ) {
         $(function(){
            //this creates a simple game where you have to find the origin
            $.infinitedrag("#InfiniteDrag .content", {}, {
               start_col: 30,
               start_row: 15,
               width: 75,
               height: 75,
               oncreate:function($element, i, j){
                  if(i == 0 && j == 0){
                     $element.text("You found the origin").css({"background-color":"#00ff00"});
                  }else{
                     $element.css({'font-size':'30px'});
                     if(i>0 && Math.abs(i)>Math.abs(j)){
                        $element.text("<");
                     }else if(i<0 && Math.abs(i)>Math.abs(j)){
                        $element.text(">");
                     }else if(j>0 && Math.abs(j)>Math.abs(i)){
                        $element.text("^");
                     }else if(j<0 && Math.abs(j)>Math.abs(i)){
                        $element.text("V");
                     }
                  }
               }
            });
         })
      })( jQuery );
   </script>
   <div id="InfiniteDrag" style="overflow:hidden;background:#cccccc;width:500px;height:500px">
      <div class="content"></div>
   </div>
```

###remove_buffer
Tiles not shown in the view port and out of the perimether defined by margin will by removed after your scroll a some distance. This option allow to set how often the operation is done. Defaults to 10 tiles.

###cleaning_enabled
Affects `remove_buffer`. Default is `true`.  
If cleaning is disabled, tiles will never be removed from the DOM no matter how far you've scrolled from them.

###draggable_lib
The name of the script doing the scrolling. by default it will check whenever you have jqueryUI or jquery.pep.js loaded.

###on_aggregate
Callback grouping of all the tiles that were created in the last couple of milliseconds(defined by aggregate_time).

This comes in very handy when creating tiles is done via AJAX and the number of request must be limited.


```html
   <script src="//code.jquery.com/jquery-1.10.2.js"></script>
   <script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
   <script src="jquery.infinitedrag.js" type="text/javascript"></script>
   <script type="text/javascript">
      (function( $ ) {
         $(function(){
            //this creates a simple game where you have to find the origin
            $.infinitedrag("#InfiniteDrag .content", {}, {
               aggregate_time: 100,
               on_aggregate:function(agg_data){
                  var infinitedrag = this;
                  $.ajax({
                     url: "datasource.php",
                     type: "POST",
                     data: { tiles : $.infinitedrag.serializeTiles(agg_data) },
                     dataType: "json"
                  }).done(function( texts ) {
                     $.each(texts,function(pos,text){
                        pos = pos.split(';');
                        var $tile = infinitedrag.get_tile(pos[0],pos[1]);
                        if($tile){
                           $tile.text(text).css({"font-weight":'bold'});
                        }
                     });
                  });
               }
            });
         })
      })( jQuery );
   </script>
   <div id="InfiniteDrag" style="overflow:hidden;background:#cccccc;width:500px;height:500px">
      <div class="content"></div>
   </div>
```

```php
<?php
	// datasource.php
   
   $data = array(
      '0;0' => 'Hello world!',
      '0;-1' => 'Foo',
      '0;1' => 'Bar',
      '0;2' => 'Baz',
      '2;0' => 'jQuery',
      '3;0' => 'Infinite Drag',
      '4;0' => 'is',
      '5;0' => 'awesome!',
      '40;10' => 'This text',
      '40;11' => 'is really',
      '40;12' => 'far away',
   );
   
   $tiles = explode(',',$_POST['tiles']);
   $res = array_intersect_key($data,array_flip($tiles));
   echo json_encode($res);
?>
```

###aggregate_time
define the time the script will wait before calling on_aggregate.

---

http://ianli.com/infinitedrag

Copyright (c) 2010 Ian Li (http://ianli.com).
Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
