var wizard_data = {};
var lo_data = {};
var menu_data = [];

jQuery(document).ready(function($) {
	
	var init = function() {

		//top buttons
		(function() {
			$( "#insert-dialog" ).hide();
			$( "#insert-buttons" ).hide();

			var insert_page = function() {
				$( "#insert-dialog" ).dialog({ width: '60%' });
			},
			
			delete_page = function() {
				alert("delete a page");
			},
			
			duplicate_page = function() {
				alert("duplicate a page");
			},
			
			buttons = $('<div />').attr('id', 'top_buttons');
			$([
				{name:'Insert', icon:'img/insert.png', id:'insert_button', click:insert_page},
				{name:'Copy', icon:'img/copy.png', id:'copy_button', click:duplicate_page},
				{name:'Delete', icon:'img/delete.gif', id:'delete_button', click:delete_page}
			])
			.each(function(index, value) {
				var button = $('<button>')
					.attr('id', value.id)
					.click(value.click)
					.append($('<img>').attr('src', value.icon).height(14))
					.append(value.name);
				buttons.append(button);
			});
			$('.ui-layout-west .header').append(buttons);
		})();

(function(){
	// load and parse the wizard xml
	$.ajax({
		type: "GET",
		url: "./data.xwd",
		dataType: "text",
		success: function(xml) {
			
			var wizard_xml = $($.parseXML(xml)).find("wizard");
			
			// Build the page menu object
			var	j, temp_menu_data = [],
				categories = String(wizard_xml[0].attributes.menus.value).split(',');

			for (j=0; j<categories.length; j++) {
				temp_menu_data.push(
					{
						"name"		: categories[j],
						"submenu"	: []
					}
				);
			}
			menu_data = {"menu": temp_menu_data};

			// Parse the xml 
			$(wizard_xml.children()).each(function(i) {
				var main_node = $(this)[0].nodeName;
                //console.log("Main node: " + main_node);
				var menu_options = {};
				for (var j=0, a=$(this)[0].attributes; j<a.length; j++) {
					menu_options[a[j].name] = a[j].value;
				}
				
				var node_options = {};
                var all_options = [];
                var name_option = [];
                var normal_options = [];
                var opt_options  = [];
                var adv_options  = [];
                var lang_options = [];

                var attributes = {};
                for (var j=0, a=$(this)[0].attributes; j<a.length; j++) {
                	if (a[j].name == 'menu') is_menu = true;
                    console.log("  attr: " + a[j].name + ":" + a[j].value);
                    attributes[a[j].name] = a[j].value;
                }
                
                // If we have a menu item then lets store it for the menu
                if (attributes.menu != undefined) {
                	var lookup = ((function (item) {
                		var i = menu_data.menu.length;
                		while (i--) if (menu_data.menu[i].name == item) return i;
                		return -1;
                	})(attributes.menu));
                	
                	if (lookup > -1) {
                		menu_data.menu[lookup].submenu.push(
                			{
                				"name"	: attributes.menuItem,
                				"hint"	: attributes.hint,
                				"thumb"	: attributes.thumb,
                				"icon"	: attributes.icon
                			}
                		);
                	}
                }

				$($(this).children()).each(function() {
					//console.log("   sub node: " + $(this)[0].nodeName);
					var node_params = {};
					for (var j=0, a=$(this)[0].attributes; j<a.length; j++) {
                        //console.log("      attr: " + a[j].name + ":" + a[j].value);
						node_params[a[j].name] = a[j].value;
					}
					all_options.push({name: [$(this)[0].nodeName], value: node_params});
				});

                // search attribute name and put that as the first one
                $(all_options).each(function(key, option) {
                    if (option.name == 'name')
                    {
                        name_option.push(option);
                    }
                });

                // if attr.type in text,html,drawing
                var cdataoption = {};
                if (attributes['type'] == 'text'
                    || attributes['type'] == 'script'
                    || attributes['type'] == 'html'
                    || attributes['type'] == 'drawing'
                    || attributes['type'] == 'hotspot'
                    || attributes['type'] == 'custom')
                {
                    node_options['cdata'] = true;
                    node_options['cdata_name'] = $(this)[0].nodeName;
                    cdataoption = {name: $(this)[0].nodeName, value: attributes};
                    normal_options.push(cdataoption);
                }

                // do the rest of the options
                $(all_options).each(function(key, option) {
                    if (option.value['optional'])
                    {
                        opt_options.push(option);
                    }
                    else if (option.value['advanced'])
                    {
                        adv_options.push(option);
                    }
                    else if (option.value['language'])
                    {
                        lang_options.push(option);
                    }
                    else
                    {
                        if (option.name != 'name')
                        {
                            normal_options.push(option);
                        }
                    }
                });
                // Add cdata also to all_options
                if (node_options['cdata_name'])
                {
                    all_options.push(cdataoption);
                }

                node_options['name'] = name_option;
                node_options['normal'] = normal_options;
                node_options['advanced'] = adv_options;
                node_options['language'] = lang_options;
                node_options['optional'] = opt_options;
                node_options['all'] = all_options;

				wizard_data[main_node] = {'menu_options' : menu_options, 'node_options' : node_options};
			});
			//wizard_data.menus = String(wizard_xml[0].attributes["menus"].value).split(',');
			
			// Now we build the "insert page" menu
			(function () {
				var getMenuItem = function (itemData) {
					var data = {
						href: '#',
						html: itemData.name
					};

					if (itemData.hint != undefined) {
						data.hint = itemData.hint;
					}
					
					if (itemData.thumb != undefined) {
						data.thumb = itemData.thumb;
					}
					
					if (itemData.icon != undefined) {
						data.icon = itemData.icon;
					}

					var item = $("<li>").append(
						$("<a>", data)
					);

					if (itemData.submenu != undefined) {
						var subList = $("<ul>");
						$.each(itemData.submenu, function () {
							subList.append(getMenuItem(this));
						});
						item.append(subList);
					}
					return item;
				};

				var $menu = $("<ul>", {
					id: 'menu'
				});
				$.each(menu_data.menu, function () {
					$menu.append(
						getMenuItem(this)
					);
				});
				$("#insert-menu").append(
					$menu.menu({
						select: function(event, ui) {
							if (ui.item.children().attr('hint') != undefined) {
								$("#insert-info img").attr("src", "../modules/xerte/parent_templates/Nottingham/" + ui.item.children().attr('thumb'));
								$("#insert-info span").text(ui.item.children().attr('hint'));
								$("#insert-buttons").show();
								console.log(ui.item.children().attr('hint'));
								console.log(ui.item.children().attr('thumb'));
								console.log(ui.item.children().attr('icon'));
							}
						}
					})
				);

			})();
		}
	});
	
})();




(function(){
	// get xml data and sorts it
	$.ajax({
		type: "GET",
		url: "./data.xml",
		dataType: "text",
		success: function(text) {
			// replace all line breaks in attributes with ascii code - otherwise these are replaced with spaces when parsed to xml
            var newString = FixLineBreaks(text);

			var tree_json = build_lo_data($($.parseXML(newString)).find("learningObject"), null);
            console.log(tree_json);
			var treeview = $('<div />').attr('id', 'treeview');
			$(".ui-layout-west .content").append(treeview);        			
			$("#treeview").jstree({
				"core" : {
					"data" : tree_json
				}
			})
			.bind('select_node.jstree', function(event, data) {
				console.log(event);
                console.log(data);

				showNodeData(data.node.id);

			});
			
			$("#treeview").jstree("select_node", "#treeroot");
		}
	});
})(); 



		//bottom buttons
		(function() {
			var up = function() {
				alert("move node up");
			},
			
			down = function() {
				alert("move node down");
			},
			
			buttons = $('<div />').attr('id', 'bottom_buttons');
			$([
				{name:'UP', icon:'', id:'up_button', click:up},
				{name:'DOWN', icon:'', id:'down_button', click:down}
			])
			.each(function(index, value) {
				var button = $('<button>')
					.attr('id', value.id)
					.click(value.click)
					.append($('<img>').attr('src', value.icon).height(14))
					.append(value.name);
				buttons.append(button);
			});
			$('.ui-layout-west .footer').append(buttons);
		})();

	};
	
	init();

});

