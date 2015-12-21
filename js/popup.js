var $ = jQuery.noConflict();

$(document).ready(function(){

	var Bookmarks = {};
	var clicked;

	// localize

	$('#header').html(chrome.i18n.getMessage("add_bookmark_to"));

	// sort

	function sort_li(a, b) {
		return ($(b).data('index')) < ($(a).data('index')) ? 1 : -1;
	};

	var myStorage = chrome.storage.local;

	// function

	function doStuff() {

		Groups = {};

		$.each(Bookmarks, function(k,v) {

			Groups[k] = {};
			Groups[k]['subgroups'] = {};

			$.each(v, function(key,val) {

				if (key == "properties") {
					Groups[k]['properties'] = val;
				} else {
					if (!($.isNumeric(key))) {
						Groups[k]['subgroups'][key] = val['properties'];
					}
				}

			});

		});

		$.each(Groups, function(key,val) {

			// icon

			if (val['properties']['icon']) {
				var icon = "<span class='"+val['properties']['icon']+"'></span>";
			} else {
				var icon = "<span class='icon-ok' style='opacity:0;'></span>";
			}

			// title

			if (val['properties']['title']) {
				var title = val['properties']['title'];
			} else {
				if (icon == "") {
					var title = "/";
				} else {
					var title = "";
				}
			}

			// space between icon and title

			var space = "&nbsp;&nbsp;&nbsp;";

			// append

			$('ul#groups').append('<li id="'+key+'" data-index="'+val['properties']['i']+'"><t>'+icon+space+title+'</t><ul></ul></li>');

			// subgroups

			$.each(val['subgroups'], function(k,v) {
				$('ul#groups li:last-of-type ul').append('<li id="'+k+'" data-index="'+v['i']+'">'+v['title']+'</li>');
			});

		});

		// sort groups

		$("ul#groups > li").sort(sort_li).appendTo('ul#groups');

		// add subgroups arrow
		// sort subgroups

		$('ul#groups li ul').each(function() {
			var n = $(this).children().length;
			if ( n > 0 ) {
				$(this).parent().attr('n-of-child',n);
				$(this).parent().find('t').after('<span class="icon-down-open-mini"></span>');
				$(this).children().sort(sort_li).appendTo(this);
			}
		});

	};

	// show groups

	myStorage.get(["bookmarks"], function(data) {

		if (data["bookmarks"]) {

			Bookmarks = data['bookmarks'];
			doStuff();

		} else {

			$.ajax({
				dataType: "json",
				url: "../defaultBookmarks.json",
				success: function(data){
					Bookmarks = data['bookmarks'];
					myStorage.set(data);
					doStuff();
				}
			});

		}

	});

	// show subgroups

	$('body').on('click', '.icon-down-open-mini', function() {

		var li = $(this).parent();

		if( $(li).hasClass('open')) {

			$(li).removeClass('open').find('ul').height(0);

		} else {

			var ul_height = $(li).attr('n-of-child');

			$('li ul').height(0).parent().removeClass('open');
			$(li).addClass('open').find('ul').height(ul_height*26+'px');

		}

	});

	// add

	$('body').on('click', 't, li ul li', function(){

		clicked = this;
		var data = {};

		// title, url
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
			data['href']  = tabs[0].url;
			data['title'] = tabs[0].title;
			save_data(data);
		});

	});

	// get group_id and save

	function save_data(data) {

		if ($(clicked).is('t')) {

			// if group

			var group_id = $(clicked).parent().attr('id');
			var i = 0;
			$.each(Bookmarks[group_id], function(k,v) {
				if ($.isNumeric(k) == true) {
					i += 1;
				}
			});
			Bookmarks[group_id][i] = data;

		} else {

			// if subgroup

			var parent   = $(clicked).parent().parent().attr('id');
			var group_id = $(clicked).attr('id');
			var i = 0;
			$.each(Bookmarks[parent][group_id], function(k,v) {
				if ($.isNumeric(k) == true) {
					i += 1;
				}
			});
			Bookmarks[parent][group_id][i] = data;
		}

		// update storage

		myStorage.set({"bookmarks":Bookmarks}, function() {
				var data = chrome.extension.getViews({'type':'tab'});
				$.each(data, function(k,v) {
					v.window.location.reload();
				});
				window.close();
		});

	}

});
