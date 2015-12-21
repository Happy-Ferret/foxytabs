var Bookmarks = {};
var clicked;

// localize

document.getElementById('header').innerHTML = chrome.i18n.getMessage("add_bookmark_to");

// sort

function sort_li(a, b) {
	return +a.dataset.index - +b.dataset.index;
};

var myStorage = chrome.storage.local;

// show groups

myStorage.get(["bookmarks"], function(data) {

	if (data["bookmarks"]) {

		Bookmarks = data['bookmarks'];
		Groups = {};

		for (var k in Bookmarks) {

			Groups[k] = {};
			Groups[k]['subgroups'] = {};

			Object.keys(Bookmarks[k]).forEach(function (key) {

				if (key == "properties") {
					Groups[k]['properties'] = Bookmarks[k]['properties'];
				} else {
					if ( isNaN(key) ) {
						Groups[k]['subgroups'][key] = Bookmarks[k][key]['properties'];
					}
				}

			});

		};

		for (var key in Groups) {

			// icon

			if (Groups[key]['properties']['icon']) {
				var icon = "<span class='"+Groups[key]['properties']['icon']+"'></span>";
			} else {
				var icon = "<span class='icon-ok' style='opacity:0;'></span>";
			}

			// title

			if (Groups[key]['properties']['title']) {
				var title = Groups[key]['properties']['title'];
			} else {
				var title = "";
			}

			// space between icon and title

			var space = "&nbsp;&nbsp;&nbsp;";

			// append groups

			var ul = document.getElementById('groups');
			var li = '<li id="'+key+'" data-index="'+Groups[key]['properties']['i']+'"><t>'+icon+space+title+'</t><ul></ul></li>';
			ul.insertAdjacentHTML('beforeend',li)

			// append subgroups

			for (k in Groups[key]['subgroups']) {
				var sub_li = '<li id="'+k+'" data-index="'+Groups[key]['subgroups'][k]['i']+'">'+Groups[key]['subgroups'][k]['title']+'</li>';
				ul.lastChild.querySelector('ul').insertAdjacentHTML('beforeend',sub_li);
			};

		};

		// sort groups

		var tooSort = ul.childNodes;

		toSort = Array.prototype.slice.call(tooSort, 0);
		toSort.sort(sort_li);

		ul.innerHTML = "";

		for(var i = 0; i < toSort.length; i++) {
				ul.appendChild(toSort[i]);
		}

		// sort subgroups

		Object.keys(tooSort).forEach(function (key) {

			var subgroups_ul = tooSort[key].querySelector('ul');
			var subgroups = subgroups_ul.childNodes;

			toSort = Array.prototype.slice.call(subgroups, 0);
			toSort.sort(sort_li);

			subgroups_ul.innerHTML = "";

			var n = toSort.length;

			for(var i = 0; i < n; i++) {
				if ( n > 0 ) {
					subgroups_ul.parentElement.setAttribute("n-of-child", n);
					subgroups_ul.insertAdjacentHTML('beforebegin','<span class="icon-down-open-mini"></span>');
					subgroups_ul.appendChild(toSort[i]);
				}
			}

		});

	}

});

document.getElementsByClassName('icon-down-open-mini').onclick = function(event) {

	var li = event.parentElement;
		console.log('kek');

	if ( !li.classList.contains('open') ) {


	}

}

//// show subgroups
//
//$('body').on('click', '.icon-down-open-mini', function() {
//
//	var li = $(this).parent();
//
//	if( $(li).hasClass('open')) {
//
//		$(li).removeClass('open').find('ul').height(0);
//
//	} else {
//
//		var ul_height = $(li).attr('n-of-child');
//
//		$('li ul').height(0).parent().removeClass('open');
//		$(li).addClass('open').find('ul').height(ul_height*26+'px');
//
//	}
//
//});
//
//// add
//
//$('body').on('click', 't, li ul li', function(){
//
//	clicked = this;
//	var data = {};
//
//	// title, url
//	chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
//		data['href']  = tabs[0].url;
//		data['title'] = tabs[0].title;
//		save_data(data);
//	});
//
//});
//
//// get group_id and save
//
//function save_data(data) {
//
//	if ($(clicked).is('t')) {
//
//		// if group
//
//		var group_id = $(clicked).parent().attr('id');
//		var i = 0;
//		$.each(Bookmarks[group_id], function(k,v) {
//			if ($.isNumeric(k) == true) {
//				i += 1;
//			}
//		});
//		Bookmarks[group_id][i] = data;
//
//	} else {
//
//		// if subgroup
//
//		var parent   = $(clicked).parent().parent().attr('id');
//		var group_id = $(clicked).attr('id');
//		var i = 0;
//		$.each(Bookmarks[parent][group_id], function(k,v) {
//			if ($.isNumeric(k) == true) {
//				i += 1;
//			}
//		});
//		Bookmarks[parent][group_id][i] = data;
//	}
//
//	// update storage
//
//	myStorage.set({"bookmarks":Bookmarks}, function() {
////			chrome.tabs.query({}, function (tabs) {
////				$.each(tabs, function(k,v) {
////					chrome.tabs.get(v['id'], function(data) {
////						console.log(data);
//////						if (!(data['title'])) {
//////							chrome.tabs.reload(v['id']);
//////						}
////					});
////				});
//			window.close();
////		});
//	});

//}

