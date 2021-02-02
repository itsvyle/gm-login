(function () {
    //https://dprox--lfny.repl.co/image?url=https%3A%2F%2Fstackoverflow.com%2Fquestions%2F11381673%2Fdetecting-a-mobile-browser
    window.isMobile = function () {
        var match = window.matchMedia || window.msMatchMedia;
        if(match) {
            var mq = match("(pointer:coarse)");
            return mq.matches;
        }
        return false;
    };
	// =========================== IMPORTING METHODS FOR OLD BROWSERS ===========================
	
	// =========================== NODE.REMOVE() ===========================
	(function (arr) {
	  arr.forEach(function (item) {
		if (item.hasOwnProperty('remove')) {
		  return;
		}
		Object.defineProperty(item, 'remove', {
		  configurable: true,
		  enumerable: true,
		  writable: true,
		  value: function remove() {
			this.parentNode.removeChild(this);
		  }
		});
	  });
	})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);


	// =========================== ARRAY.EVERY ===========================
	if (!Array.prototype.every) {
		  Array.prototype.every = function(callbackfn, thisArg) {
			var T, k;
			if (this == null) {
			  throw('this is null or not defined');
			}
			var O = Object(this);
			var len = O.length >>> 0;
			if (typeof(callbackfn) !== 'function') {
			  throw("type error");
			}
			if (arguments.length > 1) {
			  T = thisArg;
			}
			k = 0;
			while (k < len) {
			  var kValue;
			  if (k in O) {
				var testResult;
				kValue = O[k];
				if(T){
					testResult = callbackfn.call(T, kValue, k, O);
				} else {
					testResult = callbackfn(kValue,k,O);
				}
				if (!testResult) {
				  return false;
				}
			  }
			  k++;
			}
			return true;
		  };
		};
	// =========================== NODE.REPLACEWITH() ===========================
	var ReplaceWithPolyfill = function () {
	  'use-strict'; // For safari, and IE > 10
	  var parent = this.parentNode, i = arguments.length, currentNode;
	  if (!parent) return;
	  if (!i) // if there are no arguments
	    parent.removeChild(this);
	  while (i--) { // i-- decrements i and returns the value of i before the decrement
	    currentNode = arguments[i];
	    if (typeof currentNode !== 'object'){
	      currentNode = this.ownerDocument.createTextNode(currentNode);
	    } else if (currentNode.parentNode){
	      currentNode.parentNode.removeChild(currentNode);
	    }
	    // the value of "i" below is after the decrement
	    if (!i) // if currentNode is the first argument (currentNode === arguments[0])
	      parent.replaceChild(currentNode, this);
	    else // if currentNode isn't the first
	      parent.insertBefore(currentNode, this.nextSibling);
	  }
	}
	if (!Element.prototype.replaceWith)
	    Element.prototype.replaceWith = ReplaceWithPolyfill;
	if (!CharacterData.prototype.replaceWith)
	    CharacterData.prototype.replaceWith = ReplaceWithPolyfill;
	if (!DocumentType.prototype.replaceWith)
	    DocumentType.prototype.replaceWith = ReplaceWithPolyfill;

	
    // =========================== OBJECT.VALUES ===========================
    (function () {
        if (!Object.values) {
            Object.values = function (obj) {
                return Object.keys(obj).map(function(e) {
                    return obj[e];
                });
            };
        }
    })();

	// =========================== STRING.ENDSWITH / STRING.STARTSWITH ===========================
	if (!String.prototype.endsWith) {
	  String.prototype.endsWith = function(searchString, position) {
		var subjectString = this.toString();
		if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
		  position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.lastIndexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	  };
	}
	if (!String.prototype.startsWith) {
	  String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.indexOf(searchString, position) === position;
	  };
	}

	// =========================== STRING/ARRAY .INCLUDES() ===========================
	if (!String.prototype.includes) {
	  String.prototype.includes = function(search, start) {
		'use strict';

		if (search instanceof RegExp) {
		  throw TypeError('first argument must not be a RegExp');
		} 
		if (start === undefined) { start = 0; }
		return this.indexOf(search, start) !== -1;
	  };
	}
	if (!Array.prototype.includes) {
	  Array.prototype.includes = function(search, start) {
		'use strict';

		if (search instanceof RegExp) {
		  throw TypeError('first argument must not be a RegExp');
		} 
		if (start === undefined) { start = 0; }
		return this.indexOf(search, start) !== -1;
	  };
	}
	
	if (!String.prototype.replaceAll) {
		String.prototype.replaceAll = function (search,replace) {
			return this.split(search).join(replace);
		};
	}
})();

var gm = {
	onDocLoad: function (e) {
		if (gm.ondocload) {
			gm.ondocload(e);
		}
	},
	onload: function (clb) {
		if (typeof (clb) == "function") {
			gm.ondocload = clb;
		}
	},
	newItem: function (n, opts, appendTo) {
		if (typeof(opts) == "string") {
			opts = {className: opts};
		} else if (typeof (opts) != "object") {
			opts = {};
		}
		var ob = document.createElement(n);
		for (var na in opts) {
			if (na in ob) {
				ob[na] = opts[na];
			} else {
				ob.setAttribute(na, opts[na]);
			}
		}
		if (typeof (appendTo) == "object" && appendTo !== null && appendTo !== undefined) {
			appendTo.appendChild(ob);
		}
		return ob;
	},
	_importAsset: function(o) {
		gm[o.key] = o.value;
	}

}
window.addEventListener("load",gm.onDocLoad);

(function () {
	
	// =========================== N (NODE) ===========================
	gm.n = {
		childElementCount: function (n) {
			var i = 0, count = 0, node, nodes = n.childNodes;
			while (node = nodes[i++]) {
			  if (node.nodeType === 1) count++;
			}
			return count;
		},
		firstElementChild: function (n) {
			var node, nodes = n.childNodes, i = 0;
			while (node = nodes[i++]) {
				if (node.nodeType === 1) {
					return node;
				}
			}
			return null;
		},
		children: function (n) {
			var i = 0, node, nodes = n.childNodes, children = [];
			while (node = nodes[i++]) {
			  if (node.nodeType === 1) {
				children.push(node);
			  }
			}
			return children;
		}
	};

    // =========================== gm.FROMIDS ===========================
    gm.fromIDS = function (o) {
        if (!o || typeof(o) !== "object") {return {};}
        for(var n in o) {
            var id = o[n];
            if (!id || typeof(id) != "string") {id = n;}
            o[n] = document.getElementById(id);
        }
        return o;
    };

    gm.base = function (id) {
        if (!id) {id = "base";}
        var b = document.getElementById(id);
        if (!b) {return null;}
        return gm.JSONParse(b.innerHTML);
    };
	
	// =========================== gm.FLAGS ===========================
	(function () {
		var Flags = function(vals,flags_) {
			if (typeof(vals) !== "object" || !vals) {throw "'vals' must be an object";}
			
			this.flag_values = {};
			for(var n_ in vals) {
				var v_ = vals[n_];
				if (typeof(v_) !== "number") {continue;}
				this.flag_values[n_] = (1 << v_);
			}
			
			this.flags = (typeof(flags_) === "number") ? flags_ : 0;
			
			this.add = function(flag) {
				var par = this;
				if (Array.isArray(flag)) {
					return flag.every(function (f) {
						return par.add(f);
					});
				}
				if (!flag || typeof(flag) !== "string") {throw "'flag' must be a string";}
				if (!flag in this.flag_values) {return false;}
				this.flags |= this.flag_values[flag];
				return true;
			};
			
			this.has = function (flag) {
				var par = this;
				if (Array.isArray(flag)) {
					return flag.every(function (f) {
						return par.has(f);
					});
				}
				if (!flag || typeof(flag) !== "string") {throw "'flag' must be a string";}
				if (!flag in this.flag_values) {return false;}
				flag = this.flag_values[flag];
				return ((this.flags & flag) === flag);
			};
			
			this.remove = function (flag) {
				var par = this;
				if (Array.isArray(flag)) {
					return flag.every(function (f) {
						return par.remove(f);
					});
				}
				if (!flag || typeof(flag) !== "string") {throw "'flag' must be a string";}
				if (!flag in this.flag_values) {return false;}
				flag = this.flag_values[flag];
				this.flags &= ~flag;
				return true;
			};
			
			this.array = function () {
				var r = [];
				for(var f in this.flag_values) {
					if (this.has(f)) {r.push(f);}
				}
				return r;
			};
			
			this.object = function () {
				var r = {};
				for(var f in this.flag_values) {
					r[f] = this.has(f);
				}
				return r;
			};
			
			this.setFlags = function (f) {
				if (typeof(f) !== "number") {throw("'f' must be a number");}
				this.flags = f;
			};
			
			this.set = function (flag,val) {
				if (val === true) {
					this.add(flag);
				} else if (val === false) {
					this.remove(flag);
				}
			};
			
			this.fromObject = function (o) {
				if (!o || typeof(o) !== "object") {return false;}
				for(var n in o) {
					if (!(n in this.flag_values)) {continue;}
					this.set(n,o[n]);
				}
			};
			
			this.addAll = function () {
				for(var f in this.flag_values) {
					this.flags |= this.flag_values[f];
				}
			};
			
			this.cname = null;
			this.version = null;
			this.save = function () {
				throw("Flags not adapted to saving to cookies");
			};
			
			this.cookieName = function () {return null;}
			this.isNew = function () {return false;}
			this.toString = function () {
				return String(this.flags);
			};
		}
		
		Flags.fromCookie = function (vals,cname,version) {
			if (!version) {throw("'version' is absolutely required if working with cookies");}
			version = String(version);
			if (!cname || typeof(cname) !== "string") {throw("'cname' should be a string");}
			
			var actu = gm.getCookie(cname + "_v" + version);
			if (!actu) {actu = null;} else {actu = gm.parseInt(actu);}
			
			var fl = new Flags(vals,actu);
			fl.cname = cname;
			fl.version = version;
			fl.cookieName = function () {
				return this.cname + "_v" + this.version;
			};
			fl.save = function (expiresdays) {
				var c = this.cookieName();
				return gm.setCookie(c,this.toString(),expiresdays);
			};
			fl.isNew = function () {
				return (!gm.getCookie(this.cookieName()));
			}
			return fl;
		};
		gm.Flags = Flags;
	})();

	
	// =========================== SUPPORTS WS ===========================
	gm.supportWS = function () {
		return ('WebSocket' in window && window.WebSocket.CLOSING === 2);
	};
	// =========================== FORMAT NUMBER ===========================
	gm.formatNumber = function (n) {
		if (typeof (n) != "number") {
			return null;
		}
        return String(n).replace(/(.)(?=(\d{3})+$)/g,'$1,');
        return n.toLocaleString(
        undefined, // leave undefined to use the browser's locale,
                    // or use a string like 'en-US' to override it.
        { minimumFractionDigits: 0 }
        );
	};
	
	// =========================== VALIDATE OPTIONS ===========================
	gm.validateOptions = function (options, defaults, required) {
		if (!Array.isArray(required)) {
			required = [];
		}
		if (typeof (options) != "object") {
			return "Options should be object";
		}
		for (var d in defaults) {
			if (!(d in options)) {
				options[d] = defaults[d];
			}
		}
		for (var i = 0; i < required.length; i++) {
			if (!(required[i] in options)) {
				return "Missing required argument: " + required[i];
			}
		}
		return true;
	};
	
	// =========================== REQUEST ===========================
	gm.request = function (url,opts,callback) {
		if (typeof(opts) == "function") {callback = opts;opts = {};} else if (!opts) {
			opts = {};
		}
		if (typeof(opts.headers) != "object") {
            opts.headers = {
                "content-type": "application/x-www-form-urlencoded"
            };
        } else {
            if (!opts.headers['content-type']) {
                opts.headers['content-type'] = "application/x-www-form-urlencoded";
            }
        }
		var xhttp
		if (window.XMLHttpRequest) {
		   // code for modern browsers
		   xhttp = new XMLHttpRequest();
		 } else {
		   // code for old IE browsers
		   xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

        if (!Array.isArray(opts.accept_codes)) {opts.accept_codes = [200];}

		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				// && this.status == 200
				var r = {status: null,http_code: this.status,res: null,error_level: 0,error: null};
				r.headers = {};
                var hs = this.getAllResponseHeaders().trim().split(/[\r\n]+/);
                hs.forEach(function (line) {
                    var parts = line.split(': ');
                    var header = parts.shift();
                    var value = parts.join(': ');
                    r.headers[header] = value;
                });

				if (opts.accept_codes.includes(this.status) === false) {
					r.status = 0;
					r.error_level = 1;
					r.error = "Error making request(" + String(this.status) + ": " + this.responseText + ")";
				} else {
					r.status = 1;
					if (opts.json === true) {
						try {
							r.res = JSON.parse(this.responseText);
						} catch (err) {
							r.status = 0;
							r.res = null;
							r.error = "Error reading response";
						}
					} else {
						r.res = this.responseText;
					}
				}
                if (r.status === 0 && opts.notifier && typeof(opts.notifier) == "object") {
                    opts.notifier.addMessage(r.error,"background-color: red;",5000,true);
                }
				return callback(r);
			}
		};
		xhttp.error = function (e) {
			callback({status: 0,error_level: 2,error: "Error making request"});
			return xhttp.abort();
		};

        if (opts.body && typeof(opts.body) === "object") {
            try {
                opts.body = JSON.stringify(opts.body);
                opts.headers['content-type'] = "application/json";
            } catch (err) {
                console.error(err);
                opts.body = null;
            }
        }

		if (!opts.method) {opts.method = "GET";}
		xhttp.open(opts.method, url, true);
			
		for(var h in opts.headers) {
            xhttp.setRequestHeader(h,opts.headers[h]);
        }

		
		if (opts.body) {
			xhttp.send(opts.body);
		} else {
			xhttp.send();
		}
	};
	
	// =========================== GET DATA URL =============================
	gm.getDataURL = function (img,type) {
		if (!type) {type = "image/png";}
	   // Create canvas
	   const canvas = document.createElement('canvas');
	   const ctx = canvas.getContext('2d');
	   // Set width and height
	   canvas.width = img.width;
	   canvas.height = img.height;
	   // Draw the image
	   ctx.drawImage(img, 0, 0);
	   try {
		   return canvas.toDataURL(type);
	   } catch (err) {
		   return null;
	   }
	}
	
	// =========================== MODAL =============================
	gm.Modal = function (className) {
		if (className) {
			className = " " + className;
		} else {
			className = " __modal-full-screen";
		}
		this.modal = gm.newItem("div", {
			className: "__modal" + className
		});
		this.iframe = null;
		this.createIframe = function () {
			this.iframe = gm.newItem("iframe", {},this.modal);
			return this;
		};
		this.append = function () {
			document.body.appendChild(this.modal);
			return this;
		};
        var par = this;
        this.modal.addEventListener("click",function () {
            par.close();
        });

		this.navigate = function (url) {
			if (!this.iframe) {
				throw("[gm,FullScreenModal] cannot navigate without first initializing iframe");
			}
			this.iframe.src = url;
			this.open();
			return this;
		};
		
		this.navigateHTML = function (html,addHTMLBase) {
			if (!this.iframe) {
				throw("[gm,FullScreenModal] cannot navigate without first initializing iframe");
			}
			if (addHTMLBase === true) {
				html = '<html><head><title>Frame</title><meta content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" name="viewport"></head><body>' + html + '</body></html>';
			}
			var url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
			this.navigate(url);
		}
		
		this.open = function (showCloseButton) {
			var cl = this.modal.getElementsByClassName("__close")[0];
			if (showCloseButton !== false) {
				if (!cl) {
					var par = this;
					cl = gm.newItem("span",{className: "__close",innerHTML:"x",onclick: function (e) {
						par.close();
					}
					});
					if (this.iframe) {
						this.modal.insertBefore(cl,this.iframe);
					} else {
						this.modal.appendChild(cl);
					}
				}
			} else {
				if (cl) {cl.remove();}
			}
			this.modal.setAttribute("style", "display: block;");
		};
		this.close = function (clb) {
			this.modal.setAttribute("style", "");
			if (this.iframe) {
				this.iframe.src = "about:blank";
			}
			if (typeof (clb) == "function") {
				return clb();
			}
		};

	}; //closing of modal function

	// =========================== NOTIFICATION MESSAGES ===========================
	gm.NotificationMessages = function (style_) {
		if (!style_) {
			style_ = "";
		}
		this.container = gm.newItem("div", {
			className: "__notification-messages-container",
			style: style_
		}, document.body);
	
		this.showTimeBar = true;
		
		this.addMessage = function (message, style, timeout, closeOnClick) {
			if (typeof (style) != "string") {
				style = "";
			}
			if (!timeout) {
				timeout = false;
			}
			var m = gm.newItem("div", {
				className: "__notification-message",
				style: style,
				innerText: message
			});
			var timer = null;
			var timebarTimer = null;
			if (closeOnClick === true) {
				m.className += " __notification-message-clickable";
				m.onclick = function (e) {
					m.remove();
					if (timer) {
						clearTimeout(timer);
						 if (!!timebarTimer) {clearInterval(timebarTimer);}
					}
				};
				m.title = "Close";
			}

			this.container.appendChild(m);
			if (timeout !== false) {				
				var left = timeout;
				if (this.showTimeBar === true) {
					setTimeout(function () {
						var s = "width: 100%;";
						var bar = gm.newItem("div",{
							className: "__notification-message-timebar",
							style: s
						},m);
						timebarTimer = setInterval(function () {
							bar.setAttribute("style","width: " + String((left / timeout) * 100) + "%;");
							left -= 10;
						},10);
					},0.000000000000000000000000001);
				}
				
				timer = setTimeout(function () {
					m.remove();
					timer = null;
					if (!!timebarTimer) {clearInterval(timebarTimer);}
				}, timeout);
			}
			return m;
		}; //closing of addMessag

	}; //closing of gm.NotificationMessages

	// =========================== MULTILINE TEXT AREA ===========================
	gm.multilineTextArea = function (textarea,minheight_,submit) {
		if (!minheight_) {minheight_ = textarea.clientHeight;}
		var handler = function (event,isLast) {
			if (!event) {event = {which: -1};}
			if (isLast !== true) {
				if (event.which == 13 && !event.shiftKey && textarea.value.trim() != "") {
					event.preventDefault();
					if (typeof(submit) == "function") {submit(textarea);}
				} else if (event.which == 13 && event.shiftKey) {
					textarea.value += '\n';
				} else if (event.which == 13) {
					event.preventDefault();
				}	
			}
			
			textarea.setAttribute("style","height: 1px");
			var n = textarea.scrollHeight;
			if (n < minheight_) {n = minheight_;}
			textarea.setAttribute("style","height: " + String(n)+"px");
			if (isLast !== true) {
                //handler(null,true);
            }
		};
		textarea.addEventListener("keypress",handler);
		textarea.addEventListener("keyup",handler);
		handler();
	};

	// =========================== CONTEXT MENU ===========================
	gm.ContextMenu = function (menuType_) {
		if (!menuType_) {menuType_ = 1;}
		this.menu = gm.newItem("div",{
			className: "__context-menu __context-menu-" + String(menuType_)
		},document.body);
		this.menu_ul = gm.newItem("ul","__context-menu-ul",this.menu);
		var par = this;
		
		this.contextMenu = function (event,items) {
			if (!Array.isArray(items)) {throw("[gm,contextMenu] items should be an array");}
			event.preventDefault();
			var st = "top: " + String(event.clientY) + "px;left: " + String(event.clientX) + "px;";
			par.menu.setAttribute("style",st);
			par.menu_ul.innerHTML = "";
			for(var i = 0;i < items.length;i++) {
				(function () {
					var ev = function (e) {
						e.preventDefault();
						if (it.disabled == true) {return;}
						par.close();
						if (typeof(it.onclick) == "function") {it.onclick(e);}
					};					
					var it = items[i];
					if (!it.style || typeof(it.style) != "string") {it.style = "";}
					if (it.type == "separator" || it.type == "sep") {
						var li = gm.newItem("li","__context-menu-sep",par.menu_ul);
					} else {
						var s = "";
						if (it.disabled == true) {
							s += ' __context-menu-li-disabled';
						}
						var li = gm.newItem("li",{
							className: "__context-menu-li" + s,
							innerText: it.label,
							onclick: ev,
							oncontextmenu: ev,
							style: it.style
						},par.menu_ul);
						if (it.title) {li.title = it.title;}
					}
				})();
			}
			par.menu.className += ' __context-menu-show';
			setTimeout(function (e) {
				window.addEventListener("click",par.windowhandlerClick);
			},1);
		};//closing of contextMenu()
		this.windowhandlerClick = function (e) {
			e.preventDefault();
			if (!e.target) {return par.close();}
			if (!e.target.className || typeof(e.target.className) != "string") {return par.close();}
			if (e.target.className.includes("__context-menu") === false) {
				par.close();
			}
		};
		
		this.fullContext = function (element,items,events) {
			if (!events) {throw "Events must be an array of a string with a js event";}
			if (!Array.isArray(events)) {events = [events];}
			for(var i = 0;i < events.length;i++) {
				element.addEventListener(events[i],function (e) {
					e.preventDefault();
					par.contextMenu(e,items);
				});
			}
		};
		
		this.close = function (clb) {
			this.menu.className = this.menu.className.replaceAll("__context-menu-show","").trim();
			this.menu_ul.innerHTML = "";
			setTimeout(function (e) {
				window.removeEventListener("click",par.windowhandlerClick);
			},1);
		};
	};

	// =========================== PROGRESS BAR ===========================
	gm.ProgressBar = function (styleType,content,barStyle) {
		//content = 1: Bar text = percentage;content = 2: Bar text = current/total
		if (!content) {content = 0;}
		if (!styleType) {styleType = "1";}
		if (!barStyle || typeof(barStyle) != "string") {barStyle = "color: #fff;background-color: #2196F3;";}
		if (barStyle.endsWith(";") === false) {barStyle += ";";}
		this.container = gm.newItem("div",{
			className: "__progress-bar-container __progress-bar-container-" + styleType
		});
		
		this.bar = gm.newItem("div",{
			style: barStyle
		},this.container);
		
		this.full = 100;
		this.current = 0;
		this.getTextContent = function () {
			if (content === 0) {return "";}
			if (content === 1) {return String(Math.ceil(this.current / this.full * 100)) + "%";}
			if (content === 2) {return String(this.content) + "/" + String(this.full);}
			return "";
		};
		this.refresh = function () {
			var w = this.current / this.full;
			this.bar.setAttribute("style",barStyle + "width: " + String(w * 100) + "%;");
		};
		this.changeProgress = function (n,text) {
			if (typeof(n) != "number") {throw "New progress must be a number";}
			this.current = n;
			this.refresh();
			if (!text) {
				text = this.getTextContent();
			}
			this.bar.innerText = text;
		};
		this.appendTo = function (item) {
			if (!item) {throw "Missing item parameter";}
			item.appendChild(this.container);
		}
	};
    
	// =========================== COPYTEXT ===========================
	gm.copyText = function (text,clb) {
		if (typeof(clb) != "function") {clb = function () {};}
		if (!gm.copyTextTextArea) {
			gm.copyTextTextArea = gm.newItem("textarea",{style: "width: 0;height: 0;opacity: 1;position: fixed;left: -10px;"},document.body);
		}
		gm.copyTextTextArea.value = text;
		
		var selected = document.getSelection().rangeCount > 0;
		if (selected) {
			selected = document.getSelection().getRangeAt(0);
		} else {
			selected = false;
		}
			
		gm.copyTextTextArea.select();
		gm.copyTextTextArea.setSelectionRange(0, 99999);
		document.execCommand("copy");
		
		if (selected) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(selected);
		}
		clb();
	};
	
	// =========================== CHANGEURL ===========================
	gm.changeURL = function (url,title) {
		if (!title) {title = "";}
		window.history.replaceState({},title,url);
	};
	
	gm.UTCTime = function (d1) {
		if (!d1) {d1 = new Date();}
        var now = new Date(d1.getUTCFullYear(),d1.getUTCMonth(),d1.getUTCDate(),d1.getUTCHours(),d1.getUTCMinutes(),d1.getUTCSeconds(),d1.getUTCMilliseconds());
        return now.getTime();
	};
	
	gm.JSONParse = function (s) {
		try {return JSON.parse(s);} catch (err) {return null;}
	};
	
	gm.parseInt = function (s) {
		var r = parseInt(s);
		if (isNaN(r)) {return null;}
		return r;
	};
	
	gm.randomString = function (length) {
	   var result = '';
	   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	   var charactersLength = characters.length;
	   for ( var i = 0; i < length; i++ ) {
		  result += characters.charAt(Math.floor(Math.random() * charactersLength));
	   }
	   return result;
	};
	
	gm.setCookie = function(cname, cvalue, exdays) {
		var expires = "";
		if (exdays != null) {
			var d = new Date();
			d.setTime(d.getTime() + (exdays*24*60*60*1000));
			var expires = ";expires="+ d.toUTCString();
		}
	  document.cookie = cname + "=" + cvalue + expires + ";path=/";
	};
	
	gm.deleteCookie = function (cname) {
		gm.setCookie(cname,"null",-100);
	}
	
	gm.getCookie = function(cname) {
	  var name = cname + "=";
	  var decodedCookie = decodeURIComponent(document.cookie);
	  var ca = decodedCookie.split(';');
	  for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
		  c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
		  return c.substring(name.length, c.length);
		}
	  }
	  return null;
	};

	gm.limitLength = function (str,len) {
		if (typeof(str) != "string") {return null;}
		if (str.length < len + 1) {return str;}
		return str.slice(0,len);
	};
	
	gm.escapeHTML = function (str) {
		return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
	};
	
	gm.buildQuery = function (args) {
		if (!args || typeof(args) != "object") {return "";}
		var ret = "";var v;
		for(var n in args) {
			v = args[n];
			if (v === null || v === undefined) {continue;}
			if (typeof(v) == "object" || Array.isArray(v)) {v = JSON.stringify(v);}
			if (typeof(v) == "number") {v = String(v);}
			if (typeof(v) == "boolean") {if (v === true) {v = "1";} else {v = "0";}}
			v = encodeURIComponent(v);
			if (ret != "") {ret += "&";}
			ret += n + "=" + v;
		}
		return ret;
	};
	
    gm.deepEqual = function (object1, object2) {
        var isObject = function (object) {return (object != null && typeof object === 'object');};
        var keys1 = Object.keys(object1);
        var keys2 = Object.keys(object2);

        if (keys1.length !== keys2.length) {
            return false;
        }
        for(var i = 0;i < keys1.length;i++) {
            var key = keys1[i];
            var val1 = object1[key];
            var val2 = object2[key];
            var areObjects = isObject(val1) && isObject(val2);
            if (areObjects && !gm.deepEqual(val1, val2) || !areObjects && val1 !== val2
            ) {return false;}
        }
        return true;
    };

    gm.sortBy = function() {
        var fields = [].slice.call(arguments),
            n_fields = fields.length;

        return function(A,B) {
            var a, b, field, key, primer, reverse, result, i;

            for(i = 0; i < n_fields; i++) {
                result = 0;
                field = fields[i];

                key = typeof(field) === 'string' ? field : field.name;

                a = A[key];
                b = B[key];

                if (typeof(field.primer)  !== 'undefined'){
                    a = field.primer(a);
                    b = field.primer(b);
                }

                reverse = (field.reverse) ? -1 : 1;

                if (a<b){result = reverse * -1};
                if (a>b){result = reverse * 1};
                if(result !== 0) {break;}
            }
            return result;
        };
    };
		
	
	gm.formatTime = function (milliseconds) {
		if (typeof(milliseconds) != "number") {return milliseconds;}
		if (milliseconds >= (3600 * 24 * 1000)) {//more than a day
		    return String(Math.floor(milliseconds / (1000 * 60 * 60 * 24))) + "d " + String(Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) + "h " + String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + Math.floor((milliseconds % (1000 * 60)) / 1000) + "s";
		} else if (milliseconds >= 3600 * 1000) {
		    return String(Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) + "h " + String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60)))+ "m " + String(Math.floor((milliseconds % (1000 * 60)) / 1000)) + "s";
		} else if (milliseconds >= 60 * 1000) {
		    return String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + String(Math.floor((milliseconds % (1000 * 60)) / 1000)) + "s";
		} else {
		    return String(Math.round(milliseconds / 1000)) + "s";
		}
	};
	if (window._gm_assets) {
		for (var i = 0; i < window._gm_assets.length; i++) {
			gm._importAsset(window._gm_assets[i]);
		}
	}
	window._gm_assets = null;
})();
