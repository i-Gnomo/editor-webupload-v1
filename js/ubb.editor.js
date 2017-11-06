// JavaScript Document
var selectionWin = '', selectRange;
window.CUE = {
	config   : {width: 0,height: 0,zindex: 999},
	o        : null,
	_ids_    : [],
	plugins  : {},
	commands : {},
	version  : "1.0.0",
	browser  : function(){
		var agent = navigator.userAgent.toLowerCase(),opera = window.opera,browser = {
			ie		:  /(msie\s|trident.*rv:)([\w.]+)/.test(agent),
			opera	: ( !!opera && opera.version ),
			webkit	: ( agent.indexOf( ' applewebkit/' ) > -1 ),
			mac	: ( agent.indexOf( 'macintosh' ) > -1 ),
			quirks : ( document.compatMode == 'BackCompat' )
		};
		browser.gecko =( navigator.product == 'Gecko' && !browser.webkit && !browser.opera && !browser.ie);
		var version = 0;
		if ( browser.ie ){
			var v1 =  agent.match(/(?:msie\s([\w.]+))/);
			var v2 = agent.match(/(?:trident.*rv:([\w.]+))/);
			if(v1 && v2 && v1[1] && v2[1]){
				version = Math.max(v1[1]*1,v2[1]*1);
			}else if(v1 && v1[1]){
				version = v1[1]*1;
			}else if(v2 && v2[1]){
				version = v2[1]*1;
			}else{
				version = 0;
			}
	
			browser.ie11Compat = document.documentMode == 11;
			browser.ie9Compat = document.documentMode == 9;
			browser.ie8 = !!document.documentMode;
			browser.ie8Compat = document.documentMode == 8;
			browser.ie7Compat = ( ( version == 7 && !document.documentMode ) || document.documentMode == 7 );
			browser.ie6Compat = ( version < 7 || browser.quirks );
			browser.ie9above = version > 8;
			browser.ie9below = version < 9;
		}
		if ( browser.gecko ){
			var geckoRelease = agent.match( /rv:([\d\.]+)/ );
			if ( geckoRelease )
			{
				geckoRelease = geckoRelease[1].split( '.' );
				version = geckoRelease[0] * 10000 + ( geckoRelease[1] || 0 ) * 100 + ( geckoRelease[2] || 0 ) * 1;
			}
		}
		if (/chrome\/(\d+\.\d)/i.test(agent)) {
			browser.chrome = + RegExp['\x241'];
		}
		if(/(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(agent) && !/chrome/i.test(agent)){
			browser.safari = + (RegExp['\x241'] || RegExp['\x242']);
		}
		// Opera 9.50+
		if ( browser.opera ) version = parseFloat( opera.version() );
	
		// WebKit 522+ (Safari 3+)
		if ( browser.webkit ) version = parseFloat( agent.match( / applewebkit\/(\d+)/ )[1] );
		
		browser.version = version;
		
		browser.isCompatible =
			!browser.mobile && (
				( browser.ie && version >= 6 ) ||
					( browser.gecko && version >= 10801 ) ||
					( browser.opera && version >= 9.5 ) ||
					( browser.air && version >= 1 ) ||
					( browser.webkit && version >= 522 ) ||
					false );
		return browser;
	},
	Selection : {
		
	},
	toolbar  : [
		'source | bold italic underline strikethrough | superscript subscript | forecolor backcolor | removeformat | justifyleft justifycenter justifyright | link unlink | image video ',
		'| pagebreak horizontal | preview fullscreen',
	],
	zh_cn : {
        'source':'源代码','undo':'撤销','redo':'重做','bold':'加粗','italic':'斜体','underline':'下划线','strikethrough':'删除线','subscript':'下标','superscript':'上标',
		'forecolor':'字体颜色','backcolor':'背景色','removeformat':'清除格式','justifyleft':'居左对齐','justifyright':'居右对齐','justifycenter':'居中对齐',
		'link':'超链接','unlink':'取消链接','image':'图片','insertimage':'多图上传','video':'视频','pagebreak':'分页','horizontal':'分隔线','preview':'预览','fullscreen':'全屏',
		'help':'帮助','indent':'首行缩进',
	},
	randoms : function(n){
		n = n || 32; 
		var s = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
		var m = s.length;
		var p = '';
		for (i = 0; i < n; i++) {
			p += s.charAt(Math.floor(Math.random() * m));
		}
		return p;
	},
	Editor   : function(id,config){
		this.config.width  = config.width || parseInt($(id).width());
		this.config.height = config.height || parseInt($(id).height());
		this.config.zindex = config.zindex || 999;	
		
		this._c_Editor(id,config);
	},
	remove_all_range: function(){
		if(window.getSelection && selectionWin.toString().trim != ''){
			window.getSelection().removeAllRanges();
		}
	},
	execCommand : function(cmd,bool,argument){
		var me = this;
		document.execCommand(cmd.toLowerCase(), (me._isUndefined(bool)? bool: false), (me._isUndefined(argument) ? true : argument));
	},
	_c_Editor : function(id,config){
		var me = this;
		var o  = $(id),cnt = $('<div class="cue-container" style="width:'+me.config.width+'px;"><div class="cue-editor-body" style="height:'+me.config.height+'px;"></div></div>').insertBefore(o);
		cnt.find('.cue-editor-body').append(o).before('<div class="cue-toolbar"><div class="cue-btn-toolbar" unselectable="on" onmousedown="return false">'+this._c_Toolbar(config)+'</div><div class="cue-dialog-container"></div></div>');

		//removeAllranges
		me.remove_all_range();
		//cue-hover
		cnt.find('.cue-btn-toolbar').children('div.cue-btn,div.cue-splitbutton').on('mouseover mouseout',function(event){
			$(this).find('.cue-tooltip').remove();
			if (event.type == "mouseover"){
				$(this).addClass('cue-hover');
				$(this).append('<div class="cue-tooltip" unselectable="on" onmousedown="return false"><div class="cue-tooltip-arrow" unselectable="on" onmousedown="return false"></div><div class="cue-tooltip-inner" unselectable="on" onmousedown="return false">'+(me.zh_cn[$(this).attr('data-btn-key')] || '')+'</div></div>');
				$(this).find('.cue-tooltip').show();
			} else if (event.type == "mouseout"){
				$(this).removeClass('cue-hover');
			}
		});
		//forecolor,backcolor
		cnt.find('.cue-btn-toolbar .cue-splitbutton').click(function(){
			cnt.find('.cue-dialog-container div.cue-popup-dialog').hide();
			var ikey = $(this).attr('data-btn-key');
			if (!cnt.find('.cue-dialog-container div.cue-popup-dialog[data-key="'+ikey+'"]').length){
				cnt.find('.cue-dialog-container').append('<div class="cue-popup-dialog cue-dropdown-menu cue-popup" data-key="'+ikey+'" onmousedown="return false" style="z-index:'+(me.config.zindex+1)+';top:32px;left:'+(ikey=='forecolor' ? 187 : 223)+'px;position:absolute;"><div class="cue-popup-body" unselectable="on" onmousedown="return false">'+me._dialog_colorpicker(ikey)+'</div><div class="cue-popup-caret down" style="top:-8px;left:11px;position:absolute;"></div></div>');
			}
			cnt.find('.cue-dialog-container div.cue-popup-dialog[data-key="'+ikey+'"]').show();
		})
		//image,insertimage,video
		
		cnt.find('.cue-btn-toolbar').children('div.cue-btn').click(function(){
			//$('span.efocus').html(cnt.find('.cue-body-container').attr('id'));
			if ($.inArray($(this).attr('data-btn-key'),['bold','italic','underline','strikethrough','superscript','subscript','removeformat','justifyleft','justifycenter','justifyright','unlink'])!=-1){
				cnt.find('.cue-body-container').focus();
				me.execCommand($(this).attr('data-btn-key'));
			} else if ($.inArray($(this).attr('data-btn-key'),['horizontal'])!=-1){
				cnt.find('.cue-body-container').focus();
				document.execCommand('insertHtml','','<hr />');
			} else if ($.inArray($(this).attr('data-btn-key'),['pagebreak'])!=-1){
				cnt.find('.cue-body-container').focus();
				document.execCommand('insertHtml','','[page]');
			} else if ($.inArray($(this).attr('data-btn-key'),['link','image','video'])!=-1){
				me._c_popup(cnt,$(this).attr('data-btn-key'));
				me._set_focus(me._dos(cnt));
				me._get_sel(me._dos(cnt));
			}
		});
		
		cnt.find('.cue-editor-body').click(function(){
			cnt.find('.cue-dialog-container div.cue-popup-dialog').hide();
		});	
		cnt.find('.cue-dialog-container').on("click","span.cue-dialog-close,span.cue-dialog-btnclose",function(){
			$(this).parents('.cue-popup-dialog').hide();
			$(this).parents('.cue-dialog-container').find('div.cue-dialog-backdrop').hide();
		});
		//tab
		cnt.find('.cue-dialog-container').on("click","ul.cue-tab-title li",function(){
			$(this).parent('ul.cue-tab-title').find('li').removeClass('cue-tab-hover');
			$(this).addClass('cue-tab-hover');
			$(this).parents('.cue-dialog').find('.cue-tab-content .cue-tab-item').hide();
			$(this).parents('.cue-dialog').find('.cue-tab-content .cue-tab-item:eq('+$(this).prevAll('li').length+')').show();
		});
		
		//btn createlink
		cnt.find('.cue-dialog-container').on("click",".cue-link-but .cue-button",function(){
			/**
			 * author:zsx 
			 * date:2017-11-03
			 */
			var _this_btn = $(this);
			var c_t = _this_btn.attr("attr-codetype");
			if(c_t!='' && typeof c_t!='undefined'){
				//插入外链
				if(c_t === 'createlink'){
					var _in_url = $.trim(_this_btn.parents(".cue-link").find(".cue-input-text").val());
					if(_in_url == ''){
						me._dos_close_dialog(cnt);
						return false;
					}
					if(_in_url == me._verify_input(_in_url)){
						me._set_focus(me._dos(cnt));
						me._editor_code(me._dos(cnt),'createlink',_in_url);
					}
					me._dos_close_dialog(cnt);
				}
			}
		});
		cnt.find('.cue-dialog-container').on("click",".cue-dialog-btnwrap .cue-dialog-submit",function(){
			/**
			 * author:zsx 
			 * date:2017-11-06
			 */
			var _this_btn = $(this);
			var c_t = _this_btn.attr("attr-codetype");
			if(c_t!='' && typeof c_t!='undefined'){
				//插入外链图片
				if(c_t === 'insertimage'){
					var _in_url = $.trim(_this_btn.parents(".cue-tab-item").find(".cue-link-text").val());
					if(_in_url == ''){
						me._dos_close_dialog(cnt);
						return false;
					}
					if(_in_url == me._verify_input(_in_url)){
						me._set_focus(me._dos(cnt));
						me._editor_code(me._dos(cnt),'insertimage',_in_url,function(){
							return me._insertimg_setinfo(_this_btn.parents(".cue-tab-item").find("ul"));
						});
					}
					me._dos_close_dialog(cnt);
				}
			}
		});
		cnt.find('.cue-dialog-container').on("blur",".cue-image-link .cue-link-text",function(){
			var _this_in = $(this)
			var _this_val = $.trim(_this_in.val());
			if(_this_in == ''){ 
				return false;
			}else{
				var box_info = me._insertimg_setinfo(_this_in.parents("ul"));
				_this_in.parents("ul").prev(".cue-dialog-preview").html('<img src="'+box_info.src+'" width="'+box_info.w+'" height="'+box_info.h+'" />')
			}

		})

		o.replaceWith('<div id="'+o.attr('id')+'" class="cue-body-container" contenteditable="true" style="width:'+(me.config.width-16)+'px;height:'+(me.config.height-5)+'px;z-index:'+this.config.zindex+';"></div>');
		
	},
	_c_Toolbar : function(config){
		 var w = '';var me = this;
		 $.each(this.toolbar,function(i,uiNames){
			 $.each($.trim(uiNames).split(/\s+/),function(index,name){
				 if (name == '|'){
					 w += '<div class="cue-separator" unselectable="on" onmousedown="return false"></div>';
				 } else {
					 w += me._c_button(name);
				 }
			 });
		 });
		return w;
	},
	_c_button : function(name){
		return $.inArray(name,['forecolor','backcolor'])==-1 ? '<div class="cue-btn cue-btn-'+name+'" data-btn-key="'+name+'" data-tooltip-title="'+(this.zh_cn[name] || '')+'"><div unselectable="on" class="cue-icon-'+name+' cue-icon"></div></div>' : '<div class="cue-splitbutton cue-splitbutton-'+name+'" data-btn-key="'+name+'" data-tooltip-title="'+(this.zh_cn[name] || '')+'"><div class="cue-btn" unselectable="on"><div unselectable="on" class="cue-icon-'+name+' cue-icon"></div><div class="cue-splitbutton-color-label"></div></div><div unselectable="on" class="cue-btn cue-dropdown-toggle"><div unselectable="on" class="cue-caret"></div></div></div>';
	},
	_c_popup : function(cnt,pkey){
		if ($.inArray(pkey,['link','image','video'])==-1) return;
		var me = this;
		cnt.find('.cue-dialog-container div.cue-popup-dialog').hide();
		if (!cnt.find('.cue-dialog-container div.cue-popup-dialog[data-key="'+pkey+'"]').length){
			switch(pkey){
				case 'link':
					cnt.find('.cue-dialog-container').append('<div class="cue-popup-dialog cue-dropdown-menu cue-popup" unselectable="on" tabindex="-1" data-key="'+pkey+'" style="z-index:'+(me.config.zindex+1)+';top:32px;left:365px;position:absolute;"><div class="cue-popup-body">'+me._dialog_link()+'</div><div class="cue-popup-caret down" style="top:-8px;left:11px;position:absolute;"></div></div>');
				break;case 'image':case 'video':
					var l = ($(window).width()-630)/2;
					var t = ($(window).height()-368)/2;
					cnt.find('.cue-dialog-container').append('<div class="cue-popup-dialog cue-dialog" unselectable="on" tabindex="-1" data-key="'+pkey+'" style="z-index:'+(me.config.zindex+10)+';top:'+t+'px;left:'+l+'px;position:fixed;">'+(pkey=='image' ? me._dialog_image(me.randoms(32)) : me._dialog_video(me.randoms(32)))+'</div>');
					if (!cnt.find('.cue-dialog-container div.cue-dialog-backdrop').length){
						cnt.find('.cue-dialog-container').append('<div class="cue-dialog-backdrop" style="z-index:'+(me.config.zindex+1)+';"></div>');
					}
				break;
			}
		}
		cnt.find('.cue-dialog-container div.cue-popup-dialog[data-key="'+pkey+'"] :text').val('');
		cnt.find('.cue-dialog-container div.cue-popup-dialog[data-key="'+pkey+'"]').show();
		if ($.inArray(pkey,['image','video'])!=-1) {
			cnt.find('.cue-dialog-container div.cue-dialog-backdrop').show();
		}
		if ($.inArray(pkey,['image'])!=-1 && cnt.find('.cue-dialog-container .cue-dialog-image').attr('data-loader') != 'y'){
			CUE.webuploader(cnt.find('.cue-dialog-container .cue-webuploader').attr('id'));
			cnt.find('.cue-dialog-container .cue-dialog-image').attr('data-loader','y');
		}
	},
	_dos: function(c){
		return c.find('.cue-body-container');
	},
	_insertimg_setinfo: function(imgbox){
			var _w = $.trim(imgbox.find("input[attr-tag=width]").val()),
				_h = $.trim(imgbox.find("input[attr-tag=height]").val());
				_src = $.trim(imgbox.find("input.cue-link-text").val());
				_w = (parseInt(_w)>0 && !isNaN(_w))?parseInt(_w)+'px':'auto';
				_h = (parseInt(_h)>0 && !isNaN(_h))?parseInt(_h)+'px':'auto';
			return {
				src: _src,
				w: _w,
				h: _h
			}
	},
	_dos_close_dialog: function(c){
		c.find('.cue-dialog-container span.cue-dialog-close').trigger("click");
	},
	_verify_input: function(str){
		//检查输入值
		if($.inArray(str, ['http://', 'null', 'undefined', 'false', ''])>0 || str == null || str == false){
			return false;
		} else {
			return str;
		}
	},
	_set_focus: function(obj){
		if(!obj[0].hasfocus) {
			obj[0].focus();
		}
	},
	_editor_code: function(c,ctype,arg,cbk){
		var me = this;
		var url = arg;

		me.remove_all_range();
		window.getSelection().addRange(selectRange);

		//插入超链接
		if(ctype == 'createlink'){
			if(selectionWin.toString().trim != ''){
				me.execCommand('unlink'); //从当前选中区中删除全部超级链接
				me.execCommand('createlink', false, (me._isUndefined(url) ? true : url)); //将选中文本变成超连接
			}else{
				me._insert_text(c,'<a href="' + url + '" target="_blank">' + url + '</a>');
			}
		}
		if(ctype == 'insertimage'){
			console.log(typeof cbk);
			if(cbk && typeof cbk == 'function'){
				var imginfo = cbk();
				me.execCommand('insertHTML', false, '<img src="'+imginfo.src+'" width="'+imginfo.w+'" height="'+imginfo.h+'">');
			}else{
				me.execCommand('insertimage', false, (me._isUndefined(url) ? true : url));
			}
		}
	},
	_get_sel: function(dos){
		var me = this;
		selectionWin = window.getSelection();
		if(selectionWin.toString().trim != ''){
			selectRange = selectionWin ? selectionWin.getRangeAt(0) : document.createRange();
		}
	},
	_insert_text: function(c,htmlstr,movestart,moveend){
		var me = this;
		console.log(htmlstr);
		console.log('insertText:'+htmlstr+'-'+movestart+'-'+moveend);
		var fragment = document.createDocumentFragment(); //创建文档碎片节点
		var holder = document.createElement('span'); 
		holder.innerHTML = htmlstr;
		while(holder.firstChild) {
			fragment.appendChild(holder.firstChild); //把创建的span的子节点添加到fragment上
		}
		me._insertNode_AtSelection(c,fragment); //把文档碎片一次性添加到document上
	},
	_insertNode_AtSelection: function(c,text) {
		var me = this;
		me._set_focus(c);//光标位置

		// return false;
		var sel = window.getSelection(); //返回一个Selection对象,表示用户选择的文本范围或光标的当前位置。
		var range = sel ? sel.getRangeAt(0) : document.createRange();
		sel.removeAllRanges(); //清除所选中的内容
		range.deleteContents();

		var node = range.startContainer;
		var pos = range.startOffset;

		console.log('text.nodeType:'+text.nodeType+'-node.nodeType:'+node.nodeType);

		switch(node.nodeType) {
			case Node.ELEMENT_NODE:
				// element node 值为1
				if(text.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
					selNode = text.firstChild;
				} else {
					selNode = text;
				}
				node.insertBefore(text, node.childNodes[pos]);
				me._add_range(selNode);
				break;

			case Node.TEXT_NODE:
				// text node 值为3
				if(text.nodeType == Node.TEXT_NODE) {
					var text_length = pos + text.length;
					node.insertData(pos, text.data);
					range = editdoc.createRange();
					range.setEnd(node, text_length);
					range.setStart(node, text_length);
					sel.addRange(range);
				} else {
					console.log('pos：'+pos);
					node = node.splitText(pos); //返回分割后的新的文本节点
					var selNode;
					if(text.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
						selNode = text.firstChild; //yes
					} else {
						selNode = text;
					}
					node.parentNode.insertBefore(text, node);//在node前插入text
					me._add_range(selNode);
				}
				break;
		}
	},
	_add_range: function(node) {
		var sel = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(node);
		sel.removeAllRanges();
		sel.addRange(range);
	},
	_dialog_link : function(){
		var me = this;
		var w = '<div class="cue-link"><span class="cue-dialog-close"></span>请输入链接地址：<br /> <input type="text" name="linkval" value="" class="cue-input-text">';
		w += '<div class="cue-link-but"><button type="button" class="cue-button" attr-codetype="createlink">提交</button>';
		w += '</div>';
		return w;
	},
	_dialog_image : function(ikey){
		var w = '<div class="cue-dialog-image"><ul class="cue-tab-title"><span class="cue-dialog-close"></span><li class="cue-tab-hover">本地上传</li><li>网络图片</li></ul>';
		w += '<div class="cue-tab-content">';
		w += '<div class="cue-tab-item cue-tab-show">';
		w += '<div id="cue-uploader-'+ikey+'" class="cue-webuploader">';
		w += '    <div class="queueList"><div id="dndArea" class="placeholder"><div id="filePicker"></div><p>或将照片拖到这里，单次最多可选300张</p></div></div>';
		w += '    <div class="statusBar" style="display:none;">';
		w += '        <div class="progress"><span class="text">0%</span><span class="percentage"></span></div><div class="info"></div>';
		w += '        <div class="btns"><div id="filePicker2"></div><div class="uploadBtn">开始上传</div></div>';
		w += '    </div>';
		w += '</div>';
		w += '</div>';
		w += '<div class="cue-tab-item">';
		w += '  <div class="cue-dialog-btnwrap"><span class="cue-dialog-btn cue-dialog-btnclose">取消关闭</span><span class="cue-dialog-submit" attr-codetype="insertimage">确定保存</span></div>';
		w += '  <div class="cue-image-link"><div class="cue-dialog-preview"></div><ul><li>地址：<input type="text" class="cue-input-text cue-link-text"></li><li>宽度：<input type="text" class="cue-input-text" attr-tag="width"> px</li><li>高度：<input type="text" class="cue-input-text" attr-tag="height">  px</li></ul></div>';
		w += '</div>';
		w += '</div>';
		w += '</div>';
		return w;
	},
	_dialog_video : function(ikey){
		var w = '<div class="cue-dialog-video"><ul class="cue-tab-title"><span class="cue-dialog-close"></span><li class="cue-tab-hover">插入视频</li></ul>';
		w += '<div class="cue-tab-content">';
		w += '<div class="cue-tab-item cue-tab-show">';
		w += '  <div class="cue-dialog-btnwrap"><span class="cue-dialog-btn cue-dialog-btnclose">取消关闭</span><span class="cue-dialog-submit">确定保存</span></div>';
		w += '  <div class="cue-video-link"><div class="cue-dialog-preview"></div><ul><li>地址：<input type="text" class="cue-input-text cue-link-text"></li><li>宽度：<input type="text" class="cue-input-text"> px</li><li>高度：<input type="text" class="cue-input-text">  px</li></ul></div>';
		w += '</div>';
		w += '</div>';
		w += '</div>';
		return w;
	},
	_dialog_colorpicker : function(ckey){
		var colors = 'ffffff,000000,eeece1,1f497d,4f81bd,c0504d,9bbb59,8064a2,4bacc6,f79646,f2f2f2,7f7f7f,ddd9c3,c6d9f0,dbe5f1,f2dcdb,ebf1dd,e5e0ec,dbeef3,fdeada,d8d8d8,595959,c4bd97,8db3e2,b8cce4,e5b9b7,d7e3bc,ccc1d9,b7dde8,fbd5b5,bfbfbf,3f3f3f,938953,548dd4,95b3d7,d99694,c3d69b,b2a2c7,92cddc,fac08f,a5a5a5,262626,494429,17365d,366092,953734,76923c,5f497a,31859b,e36c09,7f7f7f,0c0c0c,1d1b10,0f243e,244061,632423,4f6128,3f3151,205867,974806,c00000,ff0000,ffc000,ffff00,92d050,00b050,00b0f0,0070c0,002060,7030a0'.split(',');
		var w = '<div unselectable="on" onmousedown="return false" class="cue-colorpicker cue-colorpicker-'+ckey+'" >' +
            '<table unselectable="on" onmousedown="return false">' +
            '<tr><td colspan="10">主题颜色</td> </tr>' +
            '<tr class="cue-colorpicker-firstrow" >';
		for (var i = 0; i < colors.length; i++) {
            if (i && i % 10 === 0) {
                w += '</tr>' + (i == 60 ? '<tr><td colspan="10">标准颜色</td></tr>' : '') + '<tr' + (i == 60 ? ' class="cue-colorpicker-firstrow"' : '') + '>';
            }
            w += i < 70 ? '<td><a unselectable="on" onmousedown="return false" title="' + colors[i] + '" class="cue-colorpicker-colorcell"' +
                ' data-color="#' + colors[i] + '"' +
                ' style="background-color:#' + colors[i] + ';border:solid #ccc;' +
                (i < 10 || i >= 60 ? 'border-width:1px;' :
                    i >= 10 && i < 20 ? 'border-width:1px 1px 0 1px;' :
                        'border-width:0 1px 0 1px;') +
                '"' +
                '></a></td>' : '';
        }
        w += '</tr></table></div>';
		return w;
	},
	_isUndefined: function(variable) {
		return typeof variable == 'undefined' ? true : false;
	}
}