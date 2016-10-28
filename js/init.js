

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


_G.filesize_level_ary = {
  1:5000    ,
  2:10000   ,
  3:50000   ,
  4:100000  ,
  5:500000  ,
  6:1000000 ,
  7:10000000,
}


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

// _G.bookmark_ary = loadJson(_G.save_path　+ '/bookmark.json')
// if (!_G.bookmark_ary) _G.bookmark_ary = {}
// setInitialBookmark()

// 対象の画像パス
_G.imageroot = '/Users/horimasato/Desktop/click_311'
//_G.imageroot = '/Volumes/LaCie/写真 Library.photoslibrary/Masters'
_G.thumb_dir = _G.imageroot + '/thumb'
if (!fs.existsSync(_G.thumb_dir)) fs.mkdir(_G.thumb_dir)

// SQLite処理  -----------------------------------------------------
sqlitedump = function(sql,_db){
  var out =""
  out += 'sql:' + sql + '\n'
  _db.each(sql, function (err, row) {
      var colstr = ""
      for (var colname in row){
          colstr += colname + ':' + row.colname + ' '
      }
      colstr += '\n'
      console.log('col: ' + colstr)
      out += colstr
  })
  console.log(out)
}


_G.sqlite_path = _G.approot_path +'/userdata/sqlite.db'

sqlite3 = require('sqlite3').verbose()
db = new sqlite3.Database(_G.sqlite_path)


db.serialize(function () {

  db.run("DROP TABLE images") //テスト用
  db.run("CREATE TABLE images " +
          "(id INTEGER,inode INTEGER,filesize INTEGER,filesize_level INTEGER, ctime TEXT ,mtime TEXT , " + 
          "rate INTEGER, path TEXT,dir TEXT,filename TEXT,ext TEXT, " + 
          "width INTEGER, height INTEGER, memo TEXT,thumb_gen_time INTEGER, created TEXT)" )

  // var stmt = db.prepare("INSERT INTO images (inode,path,filename,created) VALUES (?,?,?,?)")
  // for (var i = 0; i < 10; i++) stmt.run(1,"team " + i,'aaa','2016-10')
  // stmt.finalize();
      
  // データを更新する。
  // var stmt2 = db.prepare("UPDATE team SET info = ? WHERE info = ?")
  // for (var i = 0; i < 10; i+=3) stmt2.run("team 10" + i, "team " + i);
  // stmt2.finalize();
      
  //参照する。
  // 参照用関数は他にもあるが、今回は取得したものを1件ずつ扱うeach関数を利用する。
  // 引数(row)のプロパティに、SELECT句で指定した要素があるので、
  // たとえば「row.info」といったアクセスで値を取り出せる。
  // db.each("SELECT * FROM images", function (err, row) {
  //   console.log(row.inode + " : " + row.filename);
  // });

});

  // sqlitedump("select count(*) ct from images",db)
  // sqlitedump(".tables",db)

  // sql = " select count(*) as ct from images "

  // var out =""
  // out += 'sql:' + sql + '\n'
  // db.each(sql, function (err, row) {
  //     var colstr = ""
  //     for (var colname in row){
  //         colstr += colname + ':' + row.colname + ' '
  //     }
  //     colstr += '\n'
  //     console.log('col: ' + colstr)
  //     out += colstr
  // })
  // console.log(out)



// Exif処理  -----------------------------------------------------

var gm = require('gm').subClass({ imageMagick: true });
$('#image_root').html(_G.imageroot)


//全体の拡張子数のリストを作る
osRunCb("find '" + _G.imageroot + "'  -type f -maxdepth 6 | egrep -i '(\.png|\.gif|\.jpg|\.jpeg)$' ",
  function( ret_ary2,stderr,command ,cb_param){
      //$('#image_list').append(sSilver(command) + '<br/>')             
      $('#total_ext').append(sBold(ret_ary2.length) + ' ' + dumpAry(extList(ret_ary2)) + '<br/>')    
      //ファイル50軒も表示
      //if (ret_ary2.length > 0) $('#image_list').append(imageTagList(ret_ary2.slice(0,50)).join(' ') + '<br/><br/>')       
  },
  null // コールバックへの引数cb_param
)

//各子フォルダファイルの一覧を取得
osRunCb("find '" + _G.imageroot + "' -type d -maxdepth 1 ",
  function( ret_ary ){

      for (var ind in ret_ary){
          if (ret_ary[ind] == _G.imageroot ) continue
           // var dir = path.dirname(ret_ary[ind] )
           // var name = path.relative(path.dirname(path.dirname(dir)), dir)

           //全コールバックの数
           var cb_ct = ret_ary.length -1
           var now_ct = 0
           var id = 1

           osRunCb("find '" + ret_ary[ind] + "'  -type f -maxdepth 6 | egrep -i '(\.png|\.gif|\.jpg|\.jpeg)$' ",
            function( ret_ary2,stderr,command ,cb_param){
                $('#image_list').append(sSilver(command) + '<br/>')   
                $('#image_list').append(sBlue(path.relative(_G.imageroot , cb_param)) + ' ')                
                $('#image_list').append('<span onClick="osRun(\'open ' + cb_param + '\')">open</span> ')  
                $('#image_list').append(sBold(ret_ary2.length) + ' ' + dumpAry(extList(ret_ary2)) + '<br/>')
                if (ret_ary2.length > 0) {
                    $('#image_list').append(imageTagList(ret_ary2.slice(0,50)).join(' ') + '<br/><br/>')     

                    for (var ind in ret_ary2){   
                        var fullpath = ret_ary2[ind]


                        // jpeg_quality
                        // gif 色数
                        // png identify


                        //ファイル情報を取得
                        var stat = fs.statSync(fullpath) 
                        var stmt = db.prepare("INSERT INTO images (id,inode,filesize,filesize_level,ctime,mtime,path,dir,ext,filename,created) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
                        stmt.run(id,stat.ino, stat.size, getFileSizeLevel(stat.size), stat.ctime.getTime(), stat.mtime.getTime(), 
                                fullpath, path.relative( _G.imageroot, path.dirname( fullpath )  ) ,path.extname( fullpath ) , path.basename( fullpath ) , 
                                new Date().getTime())
                        stmt.finalize();

                        id++
                    }
                }
                now_ct++;
                if (now_ct == cb_ct) filterSqlite('')
                //$('#image_list').append(ret_ary2.join('<br/>') + '<br/><br/>')      
            }, // function
            ret_ary[ind] // コールバックへの引数cb_param
          ) // runcb
      } // for

     // $('#image_list').append(ret_ary.join('<br/>') + '<br/>')      
  }) // function runcb


//ファイルサイズによってランクつける
getFileSizeLevel = function( filesize ){
    var filesize_level = null
    for (var ind in _G.filesize_level_ary){
        if (filesize <= _G.filesize_level_ary[ind]){
            filesize_level = ind
            break;
        }
    }
    if ( filesize_level == null ) filesize_level = 99
    return filesize_level
}

// xyのサイズ取得  record に inode path 必要
setXY = function (record,cb){

    //imagemagickで画像情報を取得
    var shell = "identify -format '%w %h' '" + record.path + "'" 
    osRunCbParam(shell, {inode:record.inode, fullpath:record.path }, function(ret_ary,param){  //cb(ret_ary,cb_param,stderr,command)
        console.log( 'osRunCbParam iden ' , param , ret_ary.join('').trim() )
        var width_height_ary = ret_ary.join('').trim().split(' ')
    
        var sql = "UPDATE images set width=" + width_height_ary[0] + " ,height=" + width_height_ary[1] + " where inode =" + param.inode
        console.log('sql',sql)
        var stmt = db.prepare(sql)
        stmt.run()
        stmt.finalize();  

        if (typeof cb == "function") cb()
    })
}
setXYs = function (){
    var loopCt = 0;
    db.each("SELECT * FROM images", function (err, row) {
        console.log('loop' + loopCt++ , row)
        if (!row.width){
            setXY(row)
        }
    })
}

// サムネイル生成 ---------  xyを作ってから　recordに inode path width height 必要
createThumb = function(record,cb){
    console.log( 'createThumb' );

    //サムネイルなければ生成 同じ拡張子で
    var shell = "convert -resize 180x120 '" + record.path + "' " + _G.thumb_dir + '/' + record.inode + path.extname(record.path)
    osRunCbParam(shell, { x:record.width ,y:record.height }, function(ret_ary,param){  //cb(ret_ary,cb_param,stderr,command)
        console.log( 'osRunCbParam convert ')
        if (typeof cb == "function") cb()
    })
}
createThumbnails = function(){
    console.log( 'createThumbnail' );
    //sqlite読み出し
    db.each("SELECT * FROM images", function (err, row) {
        createThumb(row)
    })
}



imageTagList = function(ary){
    ret_ary = []
    for (var ind in ary){
        ret_ary[ind] = '<img src="' + ary[ind] + '" title="' + ary[ind] + '" height=50 width=50 />'
    }
    return ret_ary
}

dumpAry = function (ary){
    var str = ""
    console.log(ary)
    for (var ind in ary ){
        str += ind + ":" + ary[ind] 
    }
    return str
}

extList = function(ary){
    ret_ary = []
    for (var ind in ary){
        var ext = path.extname(ary[ind].toLowerCase())
        if (!ret_ary[ext]) ret_ary[ext] = 0
        ret_ary[ext]++
    }
    return ret_ary
}


// ipc関連初期化
const {ipcRenderer} = require('electron')
toggleDevTools = function(){  ipcRenderer.send('ipcDevTool', 'ping')   }
toggleFullScreen = function(){  ipcRenderer.send('ipcFullScreen', 'ping')   }


$("#filter_bookmark").keyup((e) =>{ 
    console.log('#filter_bookmark keyup')
    if (e.which == 13) filterSqlite($('#filter_bookmark').val());
})

filterSqlite = function(filter){

    if (filter == undefined || filter == null ) alert('filter ' + filter)

    $('#sqlite1').html('')

    var sql = "SELECT * FROM images "
    var where_ary = []
    var filter_ary = filter.trim().split(/\s+/)
    var ret = ""
    for (var ind5 in filter_ary ){
        if (filter_ary[ind5]) where_ary.push(" filename like '%" + filter_ary[ind5] + "%' ")
    }
    if (where_ary.length > 0) sql += ' where ' + where_ary.join(' and ')

    $('#sqlite1').append(sql)

    db.all(sql, function (err, rows) {
      console.log( 'images _all : ' + rows.length);
      if (rows.length > 0) $('#sqlite1').append(ary2html( recordsMatchRed(rows, filter), 'title rowcount'))
    });
}

//ショートカット
$(document).on('keydown', function(e) {

    console.log("key metakey shiftkey ctrlkey", e.which, e.metaKey, e.shiftKey, e.ctrlKey )

    if (e.which ==38 && !e.metaKey) {  //   up

    }
    if (e.which == 37 && !e.metaKey) {  //  left  小フォルダに移動

    }

    //メインプロセス通信
    if (e.metaKey && e.key == "9") toggleFullScreen(); // com 9
    if (e.metaKey && e.key == "d") toggleDevTools(); // com D

    //最小化とぶつかる
    // if (e.which ==72 && e.metaKey) {  // com H
    //    goDir(userhome_path)
    // }
   //  if (e.which ==78 && e.metaKey) {  // com N
	  //   toggleNew('toggle')
   //  }
   //  if (e.which ==69 && e.metaKey) {  // com E  エディタで編集
   //    var filename = $('#file_name').text()
   //    if (filename) osRun('open -t ' + filename)
   //  }
   //  if (e.which ==70 && e.metaKey) {  // com F   
		 //  toggleFindgrep('toggle')
	  // }
   //  if (e.which ==27) {  // esc いろいろ開いてるもの閉じる
   //    console.log('esc');
   //    toggleBookmarkList('down','')
   //    toggleFindgrep('up')
   //    $('#mainwin').hide()
   //  }
})

