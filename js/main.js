var $ = jQuery.noConflict();

$(document).ready(function(){



	// Tools



	// Generate string

	function generateString(x) {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var stringLength = x;
		var randomString = '';
		for (var i=0; i<stringLength; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomString += chars.substring(rnum,rnum+1);
		}
		return randomString;
	};

	// Sort

	function sort_li(a, b) {
		return ($(b).data('index')) < ($(a).data('index')) ? 1 : -1;
	};

	// Get bookmarks/properties/subgroups

	function getDataFrom(arr,type) {

		var data_obj = {
			properties: {},
			bookmarks:  {},
			subgroups:  {}
		};

		$.each(arr, function(key,val) {
			if ( key !== "properties") {
				if ( !($.isNumeric(key)) ) {
					// subgroups
					data_obj.subgroups[key] = val;
				} else {
					// bookmarks
					data_obj.bookmarks[key] = val;
				}
			} else {
				data_obj.properties = val;
			}
		});


		if (type) {
			return data_obj[type];
		} else {
			return data_obj;
		}

	};

	// is subgroup

	function isSubgroup(id) {

		if ( App.Bookmarks[id] ) {
			return false;
		} else {
			return true;
		}

	};

	// change color HEX

	function LightenDarkenColor(c0,p,c1) {

		var n=p<0?p*-1:p,u=Math.round,w=parseInt;
		var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
		return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)

	};



	// Localization



	$('#searchbar input').attr('placeholder', chrome.i18n.getMessage("search_for"));
	plusButtonText = chrome.i18n.getMessage("add_bookmark");

	$.each($('text'), function() {
		var id = $(this).attr('i18n');
		var text = chrome.i18n.getMessage(id);
		$(this).text(text);
	});



	// myStorage, App



	var myStorage = chrome.storage.local;

	App = {

		Settings: {},
		Bookmarks: {},
		Groups: {},
		LogotypesDB: {},
		Temp: {
			"current_group_id": null,
			"current_group_index": null,
			"current_group_type": null,
			"contexted_group_id": null,
			"contexted_group_index": null,
			"contexted_bookmark_href":null,
			"contexted_bookmark_index":null,
			"contexted_bookmark_group_id":null,
			"MaxWidth": null,
			"NumberOfColumns": {
				"grid": null,
				"list": null
			},
			"dragging_bookmark_data": null,
			"newSettings": {
				"settings":{}
			}
		},

		// open

		open: function(link) {

			if (link == "href") {
				// http://
				chrome.tabs.create({url: App.Temp['contexted_bookmark_href']});
			} else {
				chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
					var tab_id = tabs[0]['id'];
					if ( link == "addext") {
						// more extensions
						chrome.tabs.update(tab_id, {'url':'https://chrome.google.com/webstore/category/extensions'});
					} else {
						// chrome://
						chrome.tabs.update(tab_id, {'url':'chrome://' + link});
					}
				});
			}
		},

		// resize

		resizeApp: function() {
			var win_h = $(window).height();
			var win_w = $(window).width();
			var offse = $('#content .container').offset();
			$('#content .container').css({'max-height':win_h-offse.top,'width':win_w});
		},

		// search

		search: function() {

			// Get query

			var input = $.trim($('#searchbar input').val());

			if ( input.length > 0 ) {
				var query = input;
			} else {
				throw new Error("Empty!");
			}

			// Get all bookmarks

			var i = -1;
			var allBookmarks = {};

			$.each(App.Bookmarks, function(key,val){

				var data = getDataFrom(App.Bookmarks[key]);

				// All top level bookmarks in groups

				$.each(data.bookmarks, function(k,v) {
					i = i+1;
					allBookmarks[i] = v;
				});

				// All subgroups bookmarks

				$.each(data.subgroups, function(k,v) {

					var sub_data = getDataFrom(App.Bookmarks[key][k]);

					$.each(sub_data.bookmarks, function(k,v) {
						i = i+1;
						allBookmarks[i] = v;
					});

				});

			});

			// Search query

			var array = query.split(" ");
			var array_length = array.length;

			$('#bookmarks').html('<div class="bookmarks-inner"><div class="bookmarks-inner-inner list-view clearfix" id="search-results"></div></div>');

			// Append matches

			$.each(allBookmarks, function(k,v) {

				var matches = 0;

				$.each(array, function(key,val) {

					if( v['title'].indexOf(val) > -1 || v['href'].indexOf(val) > -1 ) {
						matches += 1;
					}

					if (matches == array_length) {
						$(".bookmarks-inner-inner#search-results").append(
							"<a class='bookmark' hrf='"+v['href']+"'>"+
								"<div class='title'>"+v['title']+"</div>"+
							"</a>"
						);
					}
				});

			});

			//

			settings.setColumnsBorders();

		},

		// upload img to imgur

		uploadToImgur: function(callback) {

			var img_file = document.getElementById('img-upload').files[0];

			$.ajax({
				url: 'https://api.imgur.com/3/image.json',
				type: 'POST',
				dataType: 'json',
				data: img_file,
				headers: {'Authorization': 'Client-ID 78fe6e6d7df999a'},
				cache: false,
				contentType: false,
				processData: false,
				beforeSend: function() {
					$('#img-upload-label').html('<span class="icon-spin1"></span>');
					$('.buttons span:first').addClass('inactive');
				}
			}).done(function(response) {

				callback(response);

			});

		},

		// show recently closed tabs

		showRecentlyClosedTabs: function() {

			chrome.sessions.getRecentlyClosed(function(data) {

				console.log(data);
				var id = data[0]['tab']['sessionId'];

			});


		},

		// your site could be here

		yourSiteCouldBeHere: function() {

			$('#bookmarks').html('<div class="bookmarks-inner"><div class="bookmarks-inner-inner clearfix"><div id="your-site" class="special"></div></div></div>');

			$('#your-site').load('views/yoursite.html');

		}

	};



	// Dev


	Dev = {

		show_all_default_images: function() {

			// container

			$('#bookmarks').html('<div class="bookmarks-inner"><div class="bookmarks-inner-inner grid-view clearfix"></div></div></div>');

			// append

			$.each(App.LogotypesDB, function(k,v) {

				if ( k && v ) {

					$(".bookmarks-inner-inner").append(
						"<a class='bookmark'>"+
							"<div class='default_img' style='background-image:url(http://imgh.us/foxytabs-"+v+");'></div>"+
//							"<div class='default_img' style='background-image:url(@logos/foxytabs-"+v+");'></div>"+
							"<div class='title'>"+k+"</div>"+
						"</a>"
					);

				}

			});

			// img height

			var width = $(".bookmarks-inner-inner .bookmark:first").width();
			$(".default_img").css('height',width*0.56+'px');

		}

	};



//
//	$(document).keypress(function(e) {
//	if(e.which == 53) {
//		myStorage.clear();
//		location.reload();
//	}
//	});

//	myStorage.get('bookmarks', function(data) {
//		console.log(data);
//	});

//	myStorage.clear();
//	myStorage.set({'settings':''});




	// Logotypes DB



	$.ajax({
		dataType: "json",
		url: "../logos.json",
		success: function(data){
			App.LogotypesDB = data;
		}
	});



	// Settings



	settings = {

		// Get settings

		getSettings: function(setting,callback) {
			if (setting == 'all') {
				callback(App.Settings);
			} else {
				callback(App.Settings[setting]);
			}
		},

		// Apply settings

		applySettings: function() {

			settings.getSettings('all', function(data) {
				App.Temp.MaxWidth = data['max-width'];
				App.Temp.NumberOfColumns.grid = data['columns-grid'];
				App.Temp.NumberOfColumns.list = data['columns-list'];
				settings.applyStyle(data['style']);
				settings.applyColors(data['colors']);
				settings.applyBackground(data['background']);
				settings.setMaxWidth(App.Temp['MaxWidth']);
				settings.setColumnsWidth(data['columns-grid'],data['columns-list']);
			});

			$('body').fadeIn(300);

		},

		// Show settings window

		show: function() {

			dialogues.show_dialogue('settings', '', '', function(win) {

				// show colors

				{

					colors = ['#DD4332','#aa45ba','#9131CB','#2C6EBD','#32ACDD','#72D0A9','#3A9A39','#6E9F11'];

					$.each(colors, function(k,v) {
						$(win).find('ul.colors').append(
							'<li ctrl attr-color="'+v+'" style="background-color:'+v+'"></li>'
						);
					});

					// load colorpicker color

					$('ul.colors li[attr-color="' + App.Settings.colors + '"]').addClass('active');
					if ( !$('ul.colors li.active').length ) { $('#colors-colorpicker').css('background-color',App.Settings.colors); }

					// colorpicker

					window.myColorPicker = $('#colors-colorpicker').colorPicker({
						opacity: false
					});

					$(document).on('mouseup','.cp-color-picker > div', function() {
						settings.applyColors('#' + window.myColorPicker.colorPicker.color.colors.HEX);
					});

					$(document).on('mouseup', function() {
						if ( $('.cp-color-picker').is(':visible') ) {
							settings.applyColors('#' + window.myColorPicker.colorPicker.color.colors.HEX);
						}
					});

				}

				// show backgrouns

				{

					backgrounds = [
						['http://imgh.us/foxytabs-bg-grey.jpg',  '#A5AAA6'],
						['http://imgh.us/foxytabs-bg-wood.jpg',  '#965436'],
						['http://imgh.us/foxytabs-bg-green.jpg', '#6E883E'],
						['http://imgh.us/foxytabs-bg-purple.jpg','#AB7F98'],
						['http://imgh.us/foxytabs-bg-sand.jpg',  '#DBAF4B'],
						['http://imgh.us/foxytabs-bg-sky.jpg',   '#84B6BA'],
						['http://imgh.us/foxytabs-bg-space.jpg', '#1c3c67'],
						['http://imgh.us/foxytabs-bg-warm.jpg',  '#C39F85']
					];

					$.each(backgrounds, function(k,v) {
						$(win).find('ul.backgrounds').append(
							'<li ctrl attr-bg="'+v[0]+'" style="background-color:'+v[1]+'"></li>'
						);
					});

				}

				// show columns and width sliders

				{

					sliders = [

						// slider                 min  max  step

						[ '#columns-grid-slider', 3  , 12  , 1  ],
						[ '#columns-list-slider', 1  , 10  , 1  ],
						[ '#max-width-slider'   , 800, 2500, 20 ]
					];

					$.each(sliders, function(k,v) {

						var slider = v[0];
						var min    = v[1];
						var max    = v[2];
						var step   = v[3];
						var amount = v[0]+"-amount";

						switch (k) {
							case 0: var value = App.Temp.NumberOfColumns.grid; break;
							case 1: var value = App.Temp.NumberOfColumns.list; break;
							case 2: var value = App.Temp.MaxWidth;             break;
						}

						$(slider).slider({
							value: value,
							min: min,
							max: max,
							step: step,
							slide: function(event,ui) {
								$(amount).text(ui.value);
								switch (k) {
									case 0: settings.setColumnsWidth(ui.value,''); settings.setColumnsBorders(ui.value,'skip'); break;
									case 1: settings.setColumnsWidth('',ui.value); settings.setColumnsBorders('skip',ui.value); break;
									case 2: settings.setMaxWidth(ui.value)       ; break;
								}
							}
						});

						$(amount).text(value);

					});

				}

				// make tabs equal height

				{

					var maxHeight = 0;

					$(win).find('.tab').each(function() {
						 if ($(this).height() > maxHeight) { maxHeight = $(this).height(); }
					});

	//				$(win).find('.tab').not(':first-of-type').hide();
					$(win).find('.tab').height(maxHeight).not(':first-of-type').hide();

				}

				// listen to backup import

				$('#backup-upload').on('change',function() {
					settings.import_data();
				});

				// listen to background image upload

				$('#img-upload').on('change',function() {
					App.uploadToImgur(function(response) {
						$('#img-upload-label').html('<span class="icon-ok"></span>');
						$('.buttons span:first').removeClass('inactive');
						settings.applyBackground(response.data.link);
					});
				});

			});

		},

		// Apply style change

		applyStyle: function(style) {
			$('body').removeClass('light').removeClass('dark').addClass(style);

			// temp

			if ( arguments.callee.caller.name !== "restoringSettings") {
				App['Temp']['newSettings']['settings']['style'] = style;
			}
		},

		// Apply colors changes

		applyColors: function(color) {

			$.ajax({
				dataType: "text",
				url: "../less/compiled/colors-template.css",
				success: function(data){

					var lighten = LightenDarkenColor(color,0.15);
					data = data.replace(/\$color/g, color).replace(/\$hover/g, lighten);

					// remove previous styles

					$('style#colors').remove();
					$('style#colors').disabled=true;

					// apply new css

					$('head').append('<style id="colors">'+data+'</style>');

					// temp

					if ( arguments.callee.caller.name !== "restoringSettings") {
						App['Temp']['newSettings']['settings']['colors'] = color;
					}
				}
			});


		},

		// Apply background change

		applyBackground: function(url) {
			$('body').css('background-image','url('+url+')');

			// temp

			if ( arguments.callee.caller.name !== "restoringSettings") {
				App['Temp']['newSettings']['settings']['background'] = url;
			}
		},

		// Set number of columns

		setColumnsWidth: function(grid_number,list_number) {

			styles_to_change = {};

			if ( grid_number ) {

				styles_to_change['grid-view'] = 100/grid_number;

				// temp

				if ( arguments.callee.caller.name !== "restoringSettings") {
					App['Temp']['newSettings']['settings']['columns-grid'] = grid_number;
				}
			}

			if ( list_number ) {

				styles_to_change['list-view'] = 100/list_number;

				// temp

				if ( arguments.callee.caller.name !== "restoringSettings") {
					App['Temp']['newSettings']['settings']['columns-list'] = list_number;
				}
			}

			$.each(styles_to_change, function(k,v) {

				// remove previous styles

				$('style#' + k).remove();
				$('style#' + k).disabled=true;

				// apply new css

				$('head').append(
					'<style id="'+k+'">'+
						'.'+k+' a { width:'+v+'%;}'+
					'</style>'
				);

			});

		},

		// Set bookmarks borders

		setColumnsBorders: function(grid_number,list_number) {

			var to_change = {}

			if ( !grid_number ) {
				to_change['grid'] = App.Temp.NumberOfColumns.grid;
			} else {
				if ( grid_number !== "skip" ) {
					to_change['grid'] = grid_number;
				}
			}

			if ( !list_number ) {
				to_change['list'] = App.Temp.NumberOfColumns.list;
			} else {
				if ( list_number !== "skip" ) {
					to_change['list'] = list_number;
				}
			}

			$.each(to_change, function(type,number) {

				// remove previous changes

				$("." + type + "-view  a").css('border-top-width','').removeClass('no_left_border');

				// no top border

				for (i = 0; i < number; i++) {
					$("." + type + "-view a").eq(i).css('border-top-width','0');
				}

				// no left border

				$("." + type + "-view a:first, ." + type + "-view a:nth-of-type(" + (number) + "n+1)").addClass('no_left_border');

			});

		},

		// Set maximum width of page

		setMaxWidth: function(width) {
			$('.container').css('max-width',width+'px');

			// temp

			if ( arguments.callee.caller.name !== "restoringSettings") {
				App['Temp']['newSettings']['settings']['max-width'] = width;
			}
		},

		// Save settings

		save: function() {
			settings.getSettings('all', function savingSettings(data) {
				data = $.extend( true, data, App['Temp']['newSettings']['settings'] );
				var settings = {"settings":data};
				myStorage.set(settings);
				App['Temp']['newSettings']['settings'] = {};
				dialogues.close();
			});
		},

		// Reset style changes

		restore: function() {
			settings.getSettings('all', function restoringSettings(data) {
				settings.applyStyle(data['style']);
				settings.applyColors(data['colors']);
				settings.applyBackground(data['background']);
				settings.setMaxWidth(data['max-width']);
				settings.setColumnsWidth(data['columns-grid'],data['columns-list']);
				settings.setColumnsBorders();
				App['Temp']['newSettings']['settings'] = {};
				dialogues.close();
			});
		},

		// Export data

		export_data: function() {

			myStorage.get(function(data) {
				var blob = new Blob([JSON.stringify(data)], {type: "text/plain;charset=utf-8"});
				saveAs(blob, "foxytabs-backup.json");
			});

		},

		// Import data

		import_data: function() {

			var input, file, fr;

			input = document.getElementById('backup-upload');

			if (!input.files[0]) {
				dialogues.notify('no_file_selected');
			} else {
				file = input.files[0];
				fr = new FileReader();
				fr.onload = receivedText;
				fr.readAsText(file);
			}

			function receivedText(e) {
				lines = e.target.result;
				try {
					data = JSON.parse(lines);
					myStorage.set(data);
					location.reload();
				} catch (e) {
					dialogues.notify('not_valid_json');
				}
			}

		},

		// Reset settings

		reset_settings: function() {

			myStorage.set({'settings':''});
			location.reload();

		},

		// Reset bookmarks

		reset_bookmarks: function() {

			myStorage.set({'bookmarks':''});
			location.reload();

		}

	};



	// Check and apply settings



	myStorage.get('settings', function(data) {
		if (!data['settings']) {
			defaults = {
				"settings": {
					"style": "light",
					"colors": "#32ACDD",
					"background": "http://imgh.us/foxytabs-bg-grey.jpg",
					"max-width": 1400,
					"columns-grid": 6,
					"columns-list": 3
				}
			};
			App.Settings = defaults['settings'];
			myStorage.set(defaults);
			settings.applySettings();
		} else {
			App.Settings = data['settings'];
			settings.applySettings();
		}
		App.resizeApp();
	});



	// Groups



	groups = {

		// Add or edit group

		addEdit: function(current_index) {

			//
			// PROPERTIES
			//

			// win, title, view

			var win   = $('#overlay > div');
			var title = $(win).find('input[name=title]').val();
			var view  = $(win).find('.view-selector .selected').attr('attr-x');

			// icon

			var selectedicon = $(win).find('.selectedicon');
			if (selectedicon.children('b').length == 0) {
				var icon = $(selectedicon).find('span').removeClass('selected').attr('class');
			}

			// group properties

			var data = {
				"view": view
			};

			if (title) { data['title'] = title; }
			if (icon)  { data['icon']  = icon;  }

			//
			// SUBGROUPS
			//

			var new_subgroups = {};

			$.each($(win).find('#subgroups li'), function() {

				if ( $(this).attr('id') !== "") {
					var id = $(this).attr('id');
				} else {
					var id = generateString(12);
				}

				new_subgroups[id]                        = {};
				new_subgroups[id]['properties']          = {};
				new_subgroups[id]['properties']['title'] = $(this).find('input').val();
				new_subgroups[id]['properties']['view']  = $(this).find('.view-selector .selected').attr('attr-x');
				new_subgroups[id]['properties']['i']     = $(this).index();

			});

			//
			// ADD OR EDIT
			//

			var id = $(win).find('input[name=id]').val();

			if (id) {

				// edit
				data["i"] = App.Temp['contexted_group_index'];
				App.Bookmarks[id]['properties'] = data;

			} else {

				// add
				id = generateString(12);
				data["i"] = $('#groups li').length;
				App.Bookmarks[id] = {"properties": data};

			}

			// join new subgroups and main group
			// delete deleted subgroups

			var old_subgroups = getDataFrom(App.Bookmarks[id],'subgroups');

			$.each(old_subgroups, function(k,v) {
				if ( !(new_subgroups[k]) ) {
					delete App.Bookmarks[id][k];
				}
			});

			$.extend(true, App.Bookmarks[id], new_subgroups)

			// update storage

			myStorage.set({"bookmarks":App.Bookmarks}, function() {
				App.Groups[id] = data;
				groups.show();
				groups.makeCurrentActive();
				groups.makeDroppable();
				dialogues.close();
				if (id == App.Temp.current_group_id) {
					var i = App.Groups[id]['i'];
					bookmarks.show(i);
				}
			});

		},

		// Remove group

		remove: function() {

			var id = App.Temp['contexted_group_id'];

			// show first group if removing group is current
			// if removing group is first show second

			if ( App.Temp.current_group_id == id ) {
				if ( App.Groups[id]['i'] != 1 ) {
					bookmarks.show(1);
				} else {
					bookmarks.show(2);
				}
			}

			// delete group

			delete App.Bookmarks[id];
			delete App.Groups[id];

			// delete from #groups

			$('#groups-inner').find('li#'+id).remove();

			// reindex and save

			groups.reindexSave();

		},

		// Show groups

		show: function() {

			$('#groups').html('<ul id="groups-inner" do="bookmarks|show|this.data-index"></ul>').css('opacity','0');

			$.each(App.Groups, function(key,val) {

				// icon

				if (val['icon']) {
					var icon = "<span class='"+val['icon']+"'></span>";
				} else {
					var icon = "";
				}

				// title

				if (val['title']) {
					var title = val['title'];
				} else {
					if (icon == "") {
						var title = "/";
					} else {
						var title = "";
					}
				}

				// space between icon and title

				if (val['title'] && val['icon']) {
					var space = "&nbsp;&nbsp;&nbsp;";
				} else {
					var space = "";
				}

				$('#groups-inner').append('<li id="'+key+'" ctrl data-index="'+val['i']+'">'+icon+space+title+'</li>');
			});

			// Sort by index

			$("#groups-inner li").sort(sort_li).appendTo('#groups-inner');

			// Show + button

			$('#groups').append('<ul><li ctrl do="dialogues|show|group,add" class="add"><span class="icon-plus"></span></li></ul>').css('opacity','1');

			// Sortable

			$('#groups-inner li').width(function(i,val){ return val+30; });

			$("#groups-inner").sortable({
				axis: "x",
				containment: "#groups-inner",
				distance: 20,
				start: function() {
					$('#groups li').css('transition-duration','0s');
				},
				stop: function() {
					$('#groups li').css('transition-duration','');
				},
				update: function(){
					groups.reindexSave();
				}
			});

		},

		// Reindex groups and save

		reindexSave: function() {

			// rearrange groups indexes

			var i = 0
			$('#groups-inner li').each(function() {
				i = i+1;
				id = $(this).attr('id');
				$(this).attr('data-index',i);
				App.Bookmarks[id]['properties'][i] = i;
				App.Groups[id]['i'] = i;
			});

			// update storage and close the dialog

			myStorage.set({"bookmarks":App.Bookmarks}, function() {
				dialogues.close();
			});

		},

		// Make droppable

		makeDroppable: function() {
			$('#groups-inner li').sortablee("destroy").not('.active').sortablee({
				group: "bookmarks-groups",
				onAdd: function(evt) {
					var group_id = evt.target.attributes.id.value;
					bookmarks.move(group_id, App.Temp.dragging_bookmark_data);
				}
			});
		},

		// Make current active

		makeCurrentActive: function() {
			$('#groups-inner li[data-index=' + App.Temp.current_group_index + ']').addClass('active').siblings().removeClass('active');
		},

		// Add subgroup

		addSubgroup: function(title,i,view,id) {

			if (!title) { title = ""; }
			if (!i)     { i     = ""; }
			if (!view)  { view  = ""; }
			if (!id)    { id    = ""; }

			var selected_grid, selected_list;

			if (view == "grid") {
				selected_grid = "selected";
			} else {
				selected_grid = "";
			}

			if (view == "list") {
				selected_list = "selected";
			} else {
				selected_list = "";
			}

			if (selected_grid == "" && selected_list == "") {
				// by default grid is selected
				selected_grid = "selected";
			}

			var trash_id = generateString(8);

			$('body > #overlay #subgroups').append(
				"<li data-index='"+i+"' id='"+id+"'>"+
					"<span class='icon-move'></span>"+
					"<input type='text' value='"+title+"' placeholder='"+chrome.i18n.getMessage("subgroup_name")+"'>"+
					"<span id='"+trash_id+"' ctrl do='groups|removeSubgroup|this.id' class='grid icon-trash'></span>"+
					"<div class='view-selector' do='select'>"+
						"<span ctrl attr-x='list' class='list icon-th-list "+selected_list+"'></span>"+
						"<span ctrl attr-x='grid' class='grid icon-th-thumb-empty "+selected_grid+"'></span>"+
					"</div>"+
				"</li>"
			);

			groups.makeSubgroupsSortable();

		},

		// Remove subgroup

		removeSubgroup: function(trash_id) {
			$('body > #overlay #subgroups').find('span#'+trash_id).parent().remove();
		},

		// Make groups sortable

		makeSubgroupsSortable: function() {

			$('#overlay #subgroups').sortable({
				axis: "y",
				containment: "#subgroups",
				handler: ".icon-move"
			});
		}

	}



	// Bookmarks



	bookmarks = {

		// Add or edit bookmark

		addEdit: function() {

			// win, title, url, img

			var win   = $('#overlay > div');
			var title = $(win).find('input[name=title]').val();
			var url   = $(win).find('input[name=url]').val();
			var img   = $(win).find('input[name=img]').val();

			// bookmark data

			var data = {};

			if (title)                  { data['title'] = title; }
			if (url)                    { data['href']  = url;   }
			if (img && img !== "error") { data['img']   = img;   }

			// add or edit

			var input_i = $(win).find('input[name=i]').val();
			var main = App.Temp.current_group_id;
			var id   = App.Temp.contexted_bookmark_group_id;

			if (input_i) {

				//edit
				if (isSubgroup(id)) {
					App.Bookmarks[main][id][input_i] = data;
				} else {
					App.Bookmarks[main][input_i] = data;
				}

			} else {

				// add
				i = $('.bookmarks-inner-inner:first a').length;
				App.Bookmarks[main][i-1] = data;

			}

			// update storage

			myStorage.set({"bookmarks":App.Bookmarks}, function() {
				bookmarks.show(App.Temp.current_group_index);
				dialogues.close();
			});

		},

		// Remove bookmark

		remove: function() {

			var g = App.Temp.contexted_bookmark_group_id;
			var i = App.Temp.contexted_bookmark_index;

			// delete bookmark from bookmarks

			$('.bookmarks-inner-inner#'+g).find('a[data-index="' + i + '"]').remove();

			// reindex and save

			bookmarks.reindexSave(g);

		},

		// Get bookmarks group by index

		show: function(index) {

			$.each(App.Bookmarks, function(k,v) {
				if( v['properties']['i'] == index ) {

					App.Temp.current_group_id    = k;
					App.Temp.current_group_index = index;
					App.Temp.current_group_type  = v['properties']['view'];

					// empty #bookmarks

					$('#bookmarks').empty();

					// find subgroups
					// create subgroup from top-level bookmarks

					var g = {};
					g[k]  = {};

					var data = getDataFrom(v);

					g[k] = data.bookmarks;
					g[k]['properties'] = data.properties;

					$.each(data.subgroups, function(id,data){
						g[id] = data;
					});

					// create subgroups containers

					var titles = {};

					$.each(g, function(key,val) {

						if (key == k) {
							var title = "";
							var i     = 0;
						} else {
							var title = val['properties']['title'];
							var i     = val['properties']['i'];
						}

						if ( title !== "" ) { titles[key] = title; }

						var view = val['properties']['view'];

						$('#bookmarks').append(
							'<div data-index='+i+' class="bookmarks-inner">'+
								'<div id="'+key+'" class="bookmarks-inner-inner '+view+'-view clearfix"></div>'+
							'</div>'
						);
					});

					// sort them

					$(".bookmarks-inner").sort(sort_li).appendTo('#bookmarks');

					// add titles to subgroups

					$.each(titles,function(key,v){
							$('#bookmarks .bookmarks-inner-inner#' + key).parent().before('<h4>'+v+'</h4>');
					});

					// each bookmark

					$.each(g, function(k,v) {
						$.each(v, function(key,val) {
							if (key !== 'properties') {

								// check group id and img

								var group_id = k;
								var img      = "<img class='noimg' src='img/no-img.svg'>";
								var type     = v['properties']['view'];

								// get pics

								if (val.img) {

									// if custom img link exists
									img = "<div class='custom_img' style='background-image:url("+val.img+");'></div>";

								} else {

									if ( type == "grid" ) {

										// look for default logo
										var url = val.href;
										var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];

										$.each(App.LogotypesDB, function(k,v) {
											if (k.indexOf('google') > -1) {
												// google/$ url
												if (url.indexOf(k) > -1) {
													img = "<div class='default_img' style='background-image:url(http://imgh.us/foxytabs-"+v+");'></div>";
													return false;
												}
											} else {
												// normal urls
												if ( domain.indexOf(k) > -1) {
													img = "<div class='default_img' style='background-image:url(http://imgh.us/foxytabs-"+v+");'></div>";
													return false;
												}
											}
										});

									}

								}

								// append bookmark

								$(".bookmarks-inner-inner#"+group_id).append(
									"<a class='bookmark' data-index='"+key+"' hrf='"+val.href+"'>"+
										img+
										"<div class='title'>"+val.title+"</div>"+
									"</a>"
								);

							}
						});
					});

					// bookmarks borders

					settings.setColumnsBorders();

					// add plus button

					var plusButton = "<a ctrl do='dialogues|show|bookmark,add' class='addbookmark'><span class='icon-plus'></span></a>";
					$(".bookmarks-inner-inner:first").append(plusButton);

					// adjust plus button height (if in grid-view)
					// adjust img div

					if ( App.Temp.current_group_type == "grid") {
						var width = $(".bookmarks-inner-inner:first .addbookmark span").width();
						$(".bookmarks-inner-inner:first .addbookmark span").css('line-height',width*0.56+28+'px');
						$(".custom_img, .default_img").css('height',width*0.56+'px');
					}

					// make group active

					groups.makeCurrentActive();

					// droppable groups

					groups.makeDroppable();

					// sortable bookmarks

					$('.bookmarks-inner-inner').sortablee({
						group:"bookmarks-groups",
						animation: 250,
						filter: ".addbookmark",
						ghostClass: "placeholder",
						cursorAt: { top: -10, left: -10 },
						onMove: function (evt) {
							// prevent addbookmark moving
							return evt.related.className.indexOf('addbookmark') === -1;
						},
						onStart: function(evt) {

							// get group or subgroup id
							// remember dragging bookmark data

							var group = evt.from.id;

							if ( App.Bookmarks[group] ) {
								App.Temp.dragging_bookmark_data = App.Bookmarks[group][evt.oldIndex];
							} else {
								App.Temp.dragging_bookmark_data = App.Bookmarks[App.Temp.current_group_id][group][evt.oldIndex];
							}

						},
						onSort: function(evt) {
							// update borders
							settings.setColumnsBorders();
							// reindex
							bookmarks.reindexSave(evt.srcElement.id);
						}
					});

					return false;
				}
			});

		},

		// Reindex bookmarks and save

		reindexSave: function(id) {

			// rearrange bookmarks indexes

			var main = App.Temp.current_group_id;
			var reindexedGroup = {};
			var i = -1;

			$('.bookmarks-inner-inner#'+id+" .bookmark").each(function() {

				i = i+1;

				var data = {};

				if ($(this).children('.custom_img').length > 0) {
					data.img = $(this).find('.custom_img').css('backgroundImage').replace('url(','').slice(0,-1);
				}
				data.title = $(this).find('.title').text();
				data.href  = $(this).attr('hrf');

				reindexedGroup[i] = data;
				$(this).attr('data-index',i);

			});

			if ( isSubgroup(id) ) {

				reindexedGroup['properties'] = App.Bookmarks[main][id]['properties'];
				App.Bookmarks[main][id] = reindexedGroup;

			} else {

				var data = getDataFrom(App.Bookmarks[id]);

				$.each(data.subgroups, function(k,v) {
					reindexedGroup[k] = v;
				});

				reindexedGroup['properties'] = data.properties;
				App.Bookmarks[id] = reindexedGroup;

			}

			// update storage and close the dialog

			myStorage.set({"bookmarks":App.Bookmarks}, function() {
				dialogues.close();
			});

		},

		// Move bookmark to another group

		move: function(target_group_id,bookmark_data) {

			var group = App.Bookmarks[target_group_id];
			var i     = 0;

			$.each(group, function(k,v){
				if ( $.isNumeric(k) ) {
					i = i+1;
				}
			});

			App.Bookmarks[target_group_id][i] = bookmark_data;
			myStorage.set({"bookmarks":App.Bookmarks});

		}

	};



	// Check and load bookmarks



	myStorage.get(["bookmarks"], function(data) {

		// Check bookmarks

		if (!data["bookmarks"]) {

			$.ajax({
				dataType: "json",
				url: "../defaultBookmarks.json",
				success: function(data){
					App.Bookmarks = data['bookmarks'];
					myStorage.set(data);
					then();
				}
			});

		} else {

			App.Bookmarks = data['bookmarks'];
			then();

		}

		function then() {

			$.each(App.Bookmarks, function(k,v) {
				App.Groups[k] = v['properties'];
			});

			groups.show();
			bookmarks.show(1);

		}

	});



	// Dialogues



	dialogues = {

		show_dialogue: function(html_view,dialogue,action,callback) {

			// Load view

			$('#overlay').load('views/'+html_view+'.html', function() {

				var win = $('#overlay > div');

				// style and animation

				$('#overlay').fadeIn(300).css('display','flex');
				$(win).animate({marginTop:0},300);

				// localize

				if (html_view == "bookmark" || html_view == "group" || html_view == "confirm") {

					// dynamic header
					$(win).find('.front .header text').attr('i18n',action+'_'+dialogue);
					// confirm text
					$(win).find('p.confirm text').attr('i18n','confirm_remove_'+dialogue);
					// upload img placeholder
					$(win).find('input#img').attr('placeholder', chrome.i18n.getMessage("image_url"));

				}

				$.each($('#'+win.attr('id')+' text'), function() {
					var id = $(this).attr('i18n');
					var text = chrome.i18n.getMessage(id);
					$(this).text(text);
				});

				// callback

				callback(win);

			});

		},

		// Show dialogue

		show: function(params) {

			var dialogue = params[0]; // dialogue = group|bookmark
			var action   = params[1]; // action   = add|edit|remove

			// Show confirm message if deleting

			if (action == "remove") {
				var html_view = "confirm";
			} else {
				var html_view = dialogue;
			}

			// Load view

			dialogues.show_dialogue(html_view, dialogue, action, function(win) {

				// can't delete last group

				if ( html_view == "confirm" && dialogue == "group" && $('#groups li').length == 2 ) {
					$(win).find('p.confirm text').attr('i18n','cant_remove_group');
					$(win).find('#confirm_buttons').html('<span class="button colorful cancel"><span class="icon-ok"></span><text i18n="ok"></text></span>');
				}

				// group

				if (html_view == "group") {

					// group: add

					if (action == "add") {
					 $(win).find('.selectedicon').html('<b>'+chrome.i18n.getMessage('select')+'</b>');
					 $(win).find('.view-selector > .grid').addClass('selected');
					}

					// group: edit

					if(action == "edit") {

						var id   = App.Temp.contexted_group_id;
						var data = App.Groups[id];

						// load title

						if (data.title) {
							$(win).find('input#main_title').val(data['title']);
						}

						// load icon

						if (data.icon) {
							$(win).find('.selectedicon').html("<span class='"+data['icon']+"'></span>");
							$(win).find('.group-icons-inner .'+data['icon']).addClass('selected');
						} else {
							$(win).find('.selectedicon').html('<b>'+chrome.i18n.getMessage('select')+'</b>');
							$(win).find('.group-icons-inner span:first-child').addClass('selected');
						}

						// load view

						$(win).find('.view-selector .'+data.view).addClass('selected');

						// subgroups

						var subgroups = getDataFrom(App.Bookmarks[id],'subgroups');

						$.each(subgroups, function(k,v) {
							var title = v['properties']['title'];
							var i     = v['properties']['i'];
							var view  = v['properties']['view'];
							var id    = k;
							groups.addSubgroup(title,i,view,id);
						});

						$(win).find("#subgroups li").sort(sort_li).appendTo('#subgroups');

						groups.makeSubgroupsSortable();

						// create hidden id input

						$(win).append('<input type="hidden" name="id" value="'+id+'">');

					}

				}

				// bookmark

				if (html_view == "bookmark") {

					// URL can't be empty

					var save_button = $(win).find('.buttons .button:first');

					$(win).find('input#url').on('input', function() {

						var v = $.trim($(this).val());

						if (v.length>0) {
							$(save_button).removeClass('inactive');
						} else {
							$(save_button).addClass('inactive');
						}

					});

					// img uploading listen

					$('#img-upload').on('change',function() {
						App.uploadToImgur(function(response) {

							$('#img-upload-label').html('<span class="icon-ok"></span>');

							var v = $.trim($(win).find('input#url').val());

							if (v.length>0) {
								$(save_button).removeClass('inactive');
							} else {
								$(save_button).addClass('inactive');
							}

							if (response.success == true) {
								$('#img').val(response.data.link);
							} else {
								$('#img').val('error');
							}
						});
					});

					// bookmark: add

					if (action == "add") {
						$(save_button).addClass('inactive');
					}

					// bookmark: edit

					if (action == "edit") {

						var main = App.Temp.current_group_id;
						var id   = App.Temp.contexted_bookmark_group_id;
						var i    = App.Temp.contexted_bookmark_index;
						var data;

						if (isSubgroup(id)) {
							data = App.Bookmarks[main][id][i];
						} else {
							data = App.Bookmarks[id][i];
						}

						// load title

						if (data.title) {
							$(win).find('input#main_title').val(data['title']);
						}

						// load url

						if (data.href) {
							$(win).find('input#url').val(data['href']);
						}

						// load img

						if (data.img) {
							$(win).find('input#img').val(data['img']);
						}

						// create hidden i input

						$(win).append('<input type="hidden" name="i" value="'+i+'">');

					}

				}

				// confirm remove

				if (html_view == "confirm") {
					$(win).find('span.del').attr('do',dialogue+'s|remove');
				}

			});

		},

		// Notify

		notify: function(msg) {

			$('#overlay').load('views/notification.html', function() {

				var win = $('#overlay > div');

				// style and animation

				$('#overlay').fadeIn(300).css('display','flex');
				$(win).animate({marginTop:0},300);

				$(win).find('p text').attr('i18n',msg);

				$.each($('#'+win.attr('id')+' text'), function() {
					var id = $(this).attr('i18n');
					var text = chrome.i18n.getMessage(id);
					$(this).text(text);
				});

			});

		},

		// Close dialogue

		close: function() {

			$('#overlay').fadeOut(300);
			$('#overlay > div').animate({marginTop:200},300, function() {
				$(this).remove();
			});

		},

		// Show icons list

		show_icons_list: function() {

			$('#overlay > div').css({'transform':'rotateY(90deg)','transition-duration':'.15s'});
			setTimeout( function() {
				$('#overlay .front').hide();
				$('#overlay .back').show();
				$('#overlay > div').css({'transform':'rotateY(180deg)','transition-duration':'.15s'});
			}, 150);

		},

		// Close icons list

		close_icons_list: function() {

			$('#overlay > div').css({'transform':'rotateY(90deg)','transition-duration':'.15s'});
			setTimeout( function() {
				$('#overlay .back').hide();
				$('#overlay .front').show();
				$('#overlay > div').css({'transform':'rotateY(0deg)','transition-duration':'.15s'});
			}, 150);

		},

		// Confirm icon selection

		confirm_icon: function() {

			var slctd = $('.group-icons-inner > span.selected').clone();

			if (slctd.hasClass('empty')) {
				$('.selectedicon').html('<b>'+chrome.i18n.getMessage('select')+'</b>');
			} else {
				$('.selectedicon').html(slctd);
			}

			dialogues.close_icons_list();

		}

	};



	// Controls



	$('body').on('click', '*[ctrl]', function(e) {

		e.preventDefault();

		var el = this;

		if (!($(el).hasClass('inactive'))) {

			if ($(el).is("[do]")) {
				var action = $(el).attr('do');
			} else {
				var action = $(el).parent().attr('do');
			}

			if ( action == "select" ) {

				$(this).addClass('selected');
				$(this).siblings().removeClass('selected');

			} else {

				var params = action.split('|');

				var namespace = params[0];
				var func = params[1];

				if (params[2]) {

					// if has args

					var args = params[2].split(',');

					// if has argument with THIS

					$.each(args, function(k,v) {
						if ( v.indexOf('this') > -1 ) {
							var thisattr = v.replace('this.','');
							args[k] = $(el).attr(thisattr);
						}
					});

					// Convert to string if number of args < 2

					if ( args.length < 2 ) {
						args = args.toString();
					}

				} else {
					var args = "";
				}

				window[namespace][func](args);

			}

		}

	});



	// Controls: context-menu

	$(document).on('contextmenu', function(event){
		event.preventDefault();
		$('.context-menu').hide();
	});

	$(document).on('click', function(event){
		$('.context-menu').hide();
	});

	// Controls: context-menu - groups

	$(document).on('contextmenu', '#groups-inner li', function(event){

		if(!$(this).hasClass('add')){
			$('#group-menu').finish().delay(50).fadeIn(100).css({
				top: event.pageY + "px",
				left: event.pageX + "px"
			});
			App.Temp['contexted_group_id'] = $(this).attr('id');
			App.Temp['contexted_group_index'] = $(this).attr('data-index');
		}

	});

	// Controls: context-menu - bookmarks

	$(document).on('contextmenu', 'a.bookmark', function(event){

		$('#bookmark-menu').removeClass('search-results');

		if ( $(this).parent().is('#search-results')) {
			$('#bookmark-menu').addClass('search-results');
		}

		$('#bookmark-menu').finish().delay(50).fadeIn(100).css({
			top: event.pageY + "px",
			left: event.pageX + "px"
		});
		App.Temp['contexted_bookmark_href'] = $(this).attr('hrf');
		App.Temp['contexted_bookmark_index'] = $(this).attr('data-index');
		App.Temp['contexted_bookmark_group_id'] = $(this).parent().attr('id');

	});

	// Controls: dropdown chrome menu

	$('.chrome').hover(function(){

		clearTimeout($.data(this, 'timer'));
		$('nav#menu ul').show().animate({opacity:1,marginTop:0},300);

	}, function () {

		$.data(this, 'timer', setTimeout($.proxy(function() {
			$('nav#menu ul').hide().removeAttr('style');
		}, this), 500));

	});

	$('.chrome li').click(function(){
		$('nav#menu ul').hide().removeAttr('style');
	});

	// Bookmark HRF open

	$('body').on('click','.bookmarks-inner-inner a', function() {
		var href = $(this).attr('hrf');
		if (href.startsWith("special")) {
			App.yourSiteCouldBeHere();
		} else {
			window.open(href,"_self");
		}
	});

	// Resize App

	$(window).resize(function() {
		App.resizeApp();
	});

	// Press enter to apply and close .window

	$(document).keypress(function(e) {
		if(e.which == 13) {
			$('#overlay .buttons:visible .button:first').click();
		}
	});

	// Settings tabs

	$(document).on('click', '.tabs_icons li', function() {

		var tab_id = $(this).attr('id').replace('_tab_icon','');

		$(this).addClass('active').siblings().removeClass('active').parent().parent().find('#'+tab_id).show().siblings('.tab').hide();

	});

});
