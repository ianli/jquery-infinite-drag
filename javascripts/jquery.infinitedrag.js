/*
 * jQuery Infinite Drag
 * Version 0.6
 * Copyright (c) 2010 Ian Li (http://ianli.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 *
 * Requires:
 * jQuery	http://jquery.com
 *
 * Reference:
 * http://ianli.com/infinitedrag/ for Usage
 *
 * Versions:
 * 0.6
 * - Added get_tile_dimensions public function - @JoeAO
 * 0.5
 * - Improved remove_tiles() - @JoeAO
 * 0.4b
 * - V0.4a Test code was actually fixing a problem, just badly. Reapplied and cleaned.
 * 0.4a
 * - Fixed bug caused by test code which wasn't deleted
 * 0.4
 * - Refactored additions in V0.3 - @JoeAO
 * 0.3
 * - Added removal of tiles that aren't visible - @JoeAO
 * 0.2
 * - Fixed problem with IE 8.0
 * 0.1
 * - Initial implementation
 */

//= require jquery.ui.draggable

(function($) {
	/**
	 * Function to create InfiniteDrag object.
	 */
	$.infinitedrag = function(draggable, draggable_options, tile_options) {
		return new InfiniteDrag(draggable, draggable_options, tile_options);
	};
	
	$.infinitedrag.VERSION = 0.6;
	
	/**
	 * The InfiniteDrag object.
	 */
	var InfiniteDrag = function(draggable, draggable_options, tile_options) {
		// Use self to reduce confusion about this.
		var self = this;

		var $draggable = $(draggable);
		var $viewport = $draggable.parent();
		$draggable.css({
			position: "relative",
			cursor: "move"
		});
		
		// Draggable options
		var _do = {
			shouldEase : false
		};
		$.extend( _do, draggable_options);

		// Tile options (DEFAULT)
		var _to = {
			class_name: "_tile",
			width: 100,
			height: 100,
			start_col: 0,
			start_row: 0,
			range_col: [-1000000, 1000000],
			range_row: [-1000000, 1000000],
			margin: 0,
			remove_buffer : 10,
			draggable_lib: $.fn.pep ? "pep" : "draggable",
			oncreate: function($element, i, j) {
				$element.text(i + "," + j);
			},
			on_aggregate: false,
			aggregate_time: 10
		};
		// Override tile options.
		$.extend( _to, tile_options);
		
		// Override tile options based on draggable options.
		if (_do.axis == "x") {
			_to.range_row = [_to.start_row, _to.start_row];
		} else if (_do.axis == "y") {
			_to.range_col = [_to.start_col, _to.start_col];
		}
		
		var aggregator_data = [], aggregator_timer = 0;
		
		// Creates the tile at (i, j).
		function create_tile(i, j) {
			if (i < _to.range_col[0] || _to.range_col[1] < i) {
				return;
			} else if (j < _to.range_row[0] || _to.range_row[1] < j) {
				return;
			}
			
			
			var x = i * _to.width;
			var y = j * _to.height;
			var $e = $draggable.append('<div></div>');

			var $new_tile = $e.children(":last");
			
			_storeTile($new_tile, i, j);
			
			$new_tile.attr({
				"class": _to.class_name,
				col: i,
				row: j
			});
			_setTileStyle($new_tile, i, j);

			if(_to.on_aggregate){
				aggregator_data.push({tile:$new_tile, x:i, y:j});
				if(aggregator_timer === 0){
					aggregator_timer = setTimeout(_fireAgregate,_to.aggregate_time);
				}
			}
			_to.oncreate($new_tile, i, j);
		};
		
		// Tries to register a tile
		function register_tile(elem){
			var i = $(elem).attr('col');
			var j = $(elem).attr('row');
			if(typeof i === 'undefined' || typeof j === 'undefined'){
				return;
			}
			if (typeof grid[i] == "undefined") {
				grid[i] = {};
			}
			_storeTile(elem, i, j);
			_setTileStyle(elem, i, j);
		}
		
		function _setTileStyle(tile,i,j){
			var x = i * _to.width;
			var y = j * _to.height;
			$(tile).css({
				position: "absolute",
				left: x,
				top: y,
				width: _to.width,
				height: _to.height
			});
		}
		
		function _storeTile(tile,i,j){
			grid[i][j] = $(tile).get(0);
			if(typeof grid[i].cnt == "undefined") grid[i].cnt = 0;
			grid[i].cnt++;
		}
		
		function _fireAgregate(){
			_to.on_aggregate(aggregator_data);
			aggregator_timer = 0;
			aggregator_data = [];
		}
		
		// Updates the containment box wherein the draggable can be dragged.
		var update_containment = function() {
			// Update viewport info.
			viewport_width = $viewport.width()+_to.margin*2,
			viewport_height = $viewport.height()+_to.margin*2,
			viewport_cols = Math.ceil(viewport_width / _to.width),
			viewport_rows = Math.ceil(viewport_height / _to.height);
			
			// Create containment box.
			var half_width = _to.width / 2,
				half_height = _to.height / 2,
				viewport_offset = $viewport.offset(),
				viewport_draggable_width = viewport_width - _to.width,
				viewport_draggable_height = viewport_height - _to.height;
			
			var containment = [
				(-_to.range_col[1] * _to.width) + viewport_offset.left + viewport_draggable_width,
				(-_to.range_row[1] * _to.height) + viewport_offset.top + viewport_draggable_height,
				(-_to.range_col[0] * _to.width) + viewport_offset.left,
				(-_to.range_row[0] * _to.height) + viewport_offset.top,
			];
			if(_to.draggable_lib == "draggable"){
				$draggable.draggable("option", "containment", containment);
			}
		};
		
		var last_cleaned_tiles = {
			left: 0,
			top: 0
		};
		
		var update_tiles = function(dragged_pos) {
			if (typeof dragged_pos == "undefined") {
				dragged_pos = {left: 0,top: 0}
			}
			var $this = $draggable;
			var $parent = $this.parent();

			// Problem with .position() in Chrome/WebKit:
			// 		var pos = $(this).position();
			// So, we compute it ourselves.
			var pos = {
				left: $this.offset().left - $parent.offset().left + _to.margin,
				top: $this.offset().top - $parent.offset().top + _to.margin
			}

			// - 1 because the previous tile is partially visible
			var visible_left_col = Math.ceil(-pos.left / _to.width)-1,
				visible_top_row = Math.ceil(-pos.top / _to.height)-1;

			for (var i = visible_left_col; i <= visible_left_col + viewport_cols; i++) {
				if (typeof grid[i] == "undefined") {
					grid[i] = {};
				}
				for (var j = visible_top_row; j <= visible_top_row + viewport_rows; j++) {
					if (typeof grid[i][j] == "undefined") {
						create_tile(i, j);
					}
				}
			}
			
     		if(
			   Math.abs(dragged_pos.left - last_cleaned_tiles.left) > (_to.remove_buffer * _to.width) || 
			   Math.abs(dragged_pos.top - last_cleaned_tiles.top) > (_to.remove_buffer * _to.height)
			){
				remove_tiles(visible_left_col, visible_top_row);
				last_cleaned_tiles = dragged_pos;
			}
        };

        // Removes unseen tiles
        //-----------------------
        var remove_tiles = function(left, top) {
            // Finds tiles which can be seen based on window width & height
			var maxLeft = (left + viewport_cols) + 1,
				maxTop = (top + viewport_rows);
				
			$.each(grid,function(i,rows){
				$.each(rows,function(j,elem){
					if(j !== 'cnt'){
						if((i < left) || (i > maxLeft) || (j < top) || (j > maxTop)){
							delete grid[i][j];
							grid[i].cnt--;
							if(grid[i].cnt == 0) delete grid[i];
							$(elem).remove();
						}
					}
				});
			});
        }
		
		// Public Methods
		//-----------------
		
		self.draggable = function() {
			return $draggable;
		};
		
		self.disabled = function(value) {
			if (value === undefined) {
				return $draggable;
			}
			
			$draggable.draggable("option", "disabled", value);
			
			$draggable.css({ cursor: (value) ? "default" : "move" });
		};
		
		self.center = function(col, row) {
			var x = _to.width * col,
				y = _to.height * row,
				half_width = _to.width / 2,
				half_height = _to.height / 2,
				half_vw_width = $viewport.width() / 2,
				half_vw_height = $viewport.height() / 2,
				offset = $draggable.offset();
				
			var new_offset = { 
				left: -x - (half_width - half_vw_width), 
				top: -y - (half_height - half_vw_height)
			};
			
			if (_do.axis == "x") {
				new_offset.top = offset.top;
			} else if (_do.axis == "y") {
				new_offset.left = offset.left;
			}
			
			$draggable.offset(new_offset);
			
			update_tiles(new_offset);
		};

		self.get_tile_dimensions = function() {
            var tileDims = {
                width: _to.width,
                height: _to.height
            };

            return tileDims;
        };

		// Setup
		//--------
		
		var viewport_width = $viewport.width()+_to.margin*2,
			viewport_height = $viewport.height()+_to.margin*2,
			viewport_cols = Math.ceil(viewport_width / _to.width),
			viewport_rows = Math.ceil(viewport_height / _to.height);

		$draggable.offset({
			left: $viewport.offset().left - (_to.start_col * _to.width),
			top: $viewport.offset().top - (_to.start_row * _to.height)
		});

		var grid = {};
		
		// Tries to register any existing tiles
		$draggable.children("."+_to.class_name).each(function(){
			register_tile(this);
		});
		
		// Create initial tiles
		update_tiles();
		
		// Handle resize of window.
		$(window).resize(function() {
			// HACK:
			// Update the containment when the window is resized
			// because the containment boundaries depend on the offset of the viewport.
			update_containment();
		});
		
		// The drag event handler.
		_do.drag = function(e, ui) {
			update_tiles(ui.position);
		};
		$draggable[_to.draggable_lib](_do);
		
		update_containment();
	};
})(jQuery);
