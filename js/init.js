

_G = []
_G.commandlog = []

console.log('process.env.USER',process.env.USER)
console.log('process.cwd()',process.cwd())
console.log('process.resourcesPath',process.resourcesPath)

_G.approot_path = process.cwd() 
//アプリ版ならresourcePathを使う
if (process.cwd() == "/"){
    _G.approot_path = process.resourcesPath + '/app' 
}
_G.save_path = _G.approot_path + '/userdata'


execOption = { encoding: 'utf8',
                  timeout: 0,
                  maxBuffer: 2000*1024,  //200*1024
                  killSignal: 'SIGTERM',
                  cwd: '',
                  env: null }

repo_btn_prev_push = "" //リポジトリ以下のBUTTONで直前push したもの
repo_prev_push = ""
top_filtered_repo = ""

_G.username = ""
_G.current_path = ""
_G.history_ary = {}
_G.bookmark_ary = {}

_G.username = process.env.USER

console.log('process.env.USER',process.env.USER)
console.log('process.cwd()',process.cwd())
console.log('process.resourcesPath',process.resourcesPath)


//保存ファイル読み込み
if (!fs.existsSync(_G.approot_path +'/userdata')) fs.mkdir(_G.approot_path +'/userdata')

_G.bookmark_ary = loadJson(_G.save_path　+ '/bookmark.json')
if (!_G.bookmark_ary) _G.bookmark_ary = {}
setInitialBookmark()

_G.history_ary = loadJson(_G.save_path + '/history.json')
console.log('history_ary', _G.history_ary)
if (!_G.history_ary) _G.history_ary = {}
toggleBookmarkList('down','')

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


// ipc関連初期化
const {ipcRenderer} = require('electron')
toggleDevTools = function(){  ipcRenderer.send('ipcDevTool', 'ping')   }
toggleFullScreen = function(){  ipcRenderer.send('ipcFullScreen', 'ping')   }


$("#filter").keyup((e) =>{ 
    clearFileContents()
    showFilelist(_G.current_path , $('#filter').val(),'file_contents1')
})

//ファイルの中身表示 mouseOver
$(document).on('mouseover','.tFile', function(e) {
    console.log('mouseOver tFile' , e.target)
    var fname = $(e.target).attr('bmkey')
    showFileContents(fname,$(e.target).attr('child_list_id'))  
})

//dir ならdir名とブックマーク一覧を表示
$(document).on('mouseover','.tDir', function(e) {
  console.log('mouseOver tDir ' , e.target)

  $('#' + $(e.target).attr('child_name_id')).html( sBlue($(e.target).text()) )
  //osRunOut("ls '" + $(e.target).text() + "'" , $(e.target).attr('child_list_id'),'replace' )
  // dir なら青、 dirなら次のpaneにファイル一覧を表示  ファイルなら次のpaneに中身を表示

  showFilelist($(e.target).attr('fullpath'),'', $(e.target).attr('child_list_id'))
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

    //メインプロセス通信
    if (e.metaKey && e.key == "9") toggleFullScreen(); // com 9
    if (e.metaKey && e.key == "d") toggleDevTools(); // com D

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
      console.log('esc');
      toggleBookmarkList('down','')
      toggleFindgrep('up')
      $('#mainwin').hide()
    }
})

