
_G.username = ""
_G.current_path = ""
_G.history_ary = {}
_G.bookmark_ary = {}

_G.username = process.env.USER


//保存ファイル読み込み
if (!fs.existsSync('userdata')) fs.mkdir('userdata')

_G.bookmark_ary = loadJson(_G.save_path　+ '/bookmark.json')
if (!_G.bookmark_ary) _G.bookmark_ary = {}
setInitialBookmark()

_G.history_ary = loadJson(_G.save_path + '/history.json')
console.log('history_ary', _G.history_ary)
if (!_G.history_ary) _G.history_ary = {}
toggleBookmarkList('down','')
toggleFindgrep('up')


//初期処理
goDir(process.env.HOME)

//android projectをbookmarkに登録
osRunCb("find ~ -type f -maxdepth 6 | egrep 'AndroidManifest.xml$' ",
  function( ret_ary ){
      for (var ind in ret_ary){
          var dir = path.dirname(ret_ary[ind] )
          var name = path.relative(path.dirname(path.dirname(dir)), dir)
          setBookmark(dir,name) // name = 直近2階層
      }
      toggleBookmarkList('down','')
  }
)


osRunCb("find ~ -type f -maxdepth 6 | egrep 'xcodeproj$' ",
  function( ret_ary ){
      for (var ind in ret_ary){
          var dir = path.dirname(ret_ary[ind] )
          var name = path.relative(path.dirname(path.dirname(dir)), dir)
          setBookmark(dir,name) // name = 直近2階層
      }
      toggleBookmarkList('down','')
  }
)




$("#filter").keyup((e) =>{ showFilelist(_G.current_path , $('#filter').val()) })


//ファイルの中身表示 mouseOver
$(document).on('mouseover','.tFile', function(e) {
  console.log('mouseOver ' , e.target)

  var fname = $(e.target).attr('bmkey')
  showFileContents(fname)
})

$(document).on('mouseover','.tDir', function(e) {
  console.log('mouseOver ' , e.target)
  $('#file_name').html( sBlue($(e.target).text()) )
  osRunOut('ls ' + $(e.target).text() , 'file_contents','replace' )
})


$('#command_str').on('keyup',function(e){
  if (e.which == 13){
      osRunOut($(this).val(),'command_out','replace')
  }
})


//ショートカット
$(document).on('keydown', function(e) {

    console.log("key metakey shiftkey ctrlkey", e.which, e.metaKey, e.shiftKey, e.ctrlKey )

    if (e.which ==38 && !e.metaKey) {  //   up

    }
    if (e.which == 37 && !e.metaKey) {  //  left  小フォルダに移動


    }

    if (e.which ==38 && e.metaKey) {  //  com up
       _G.current_path = _G.current_path.replace(/(.*)(\/.*?$)/,'$1')
       if (!_G.current_path) _G.current_path="/"
       goDir(_G.current_path)
    }
    if (e.which == 37 && e.metaKey) {  //  com left  ひとつ前のフォルダ
    	console.log('com left')
    	console.log('_G.history_ary',_G.history_ary)
    	console.log('pop',_G.history_ary.pop())
      _G.current_path = _G.history_ary.pop()
      if (!_G.current_path) _G.current_path="/"
      goDir(_G.current_path)
    }

    //最小化とぶつかる
    // if (e.which ==72 && e.metaKey) {  // com H
    //    goDir(userhome_path)
    // }
    if (e.which ==78 && e.metaKey) {  // com N
	    toggleNew('toggle')
    }
    if (e.which ==69 && e.metaKey) {  // com E  エディタで編集
      var filename = $('#file_name').text()
      if (filename) osRun('open -t ' + filename)
    }
    if (e.which ==70 && e.metaKey) {  // com F   
		  toggleFindgrep('toggle')
	  }
    if (e.which ==27) {  // esc いろいろ開いてるもの閉じる
      toggleBookmarkList('down','')
      toggleFindgrep('up')
      $('#mainwin').hide()
    }
})

