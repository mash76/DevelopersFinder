
//ブックマークを追加して、ファイルに保存
setBookmark = function(fullpath,name){
  console.log('setBookmark ' + fullpath)
  if (!fs.existsSync(fullpath)) {
    alert(fullpath + ' not exist')
    return false;
  }

  if ( _G.bookmark_ary[fullpath] ){
      console.log('登録済 更新' + fullpath )
  }

  if (!name) name = path.basename(fullpath)

  _G.bookmark_ary[fullpath] = name
  saveJson(_G.save_path　+ '/bookmark.json',_G.bookmark_ary)
}

toggleBookmarkList = function(updown , filter ){

  if (!updown.match(/(up|down|toggle)/)) alert('updown not up or down')
  if (filter == undefined) alert('toggleBookmarkList filter undefined')

  $('#filter_bookmark').val(filter)

  if (updown == 'toggle' ){
    if ($('#bookmark').css('display') == 'block')  updown = 'up'
    else  updown = 'down'
  }

  if (updown == 'up'){
      $('#bookmark').slideUp(10)
      return
  }

  //あとはdown
  updateBookmarkList(filter)
  updateHistoryList(filter)

  $('#bookmark').slideDown(10)
  $('#filter_bookmark').focus()
}

updateBookmarkList = function(filter){

  var re1 = new RegExp( '(' + filter + ')', 'gi')

  //絞込
  var ary_bm_out = []
  for (var ind in _G.bookmark_ary ) {
      if (ind.match(re1) || _G.bookmark_ary[ind].match(re1)) {
          ary_bm_out[ind] = _G.bookmark_ary[ind]
      }
  }

  //booklark list 更新
  var bm_list_num = 1;
  var out = []
  for (var ind in ary_bm_out ) {

    var classname="tFile"
    if (fs.statSync(ind).isDirectory()) classname = "tDir"

    var path_disp = ind
    var name_disp = ary_bm_out[ind]
    if (filter){
        path_disp = path_disp.replace(re1,sRed('$1'))
        name_disp = name_disp.replace(re1,sRed('$1'))
    }
    // tFile か tdirのclassがつく
    out.push(
      { "name": '<span class="bm_go ' + classname +'" fullpath="' + ind + '" bmlistnum="' + bm_list_num + '" bmkey="' + ind + '">' +
        name_disp + '</span>',
        "path": sSilver(s80(path_disp)),
        "del": '<span class="bm_del btn" bmkey="'+ ind +'">del</span> ',
        "edit": '<span class="bl_edit btn" bmkey="' +  ind + '">edit</span>'
      })
    bm_list_num++
  }
  $('#bookmark_list').html( '<br/>' + 'bookmark ' + out.length + ary2html(out,'')  )
}

updateHistoryList = function(filter){

  var re1 = new RegExp( '(' + filter + ')', 'gi')

  //history list 更新
  var ary_his_out = []
  for (var ind in _G.history_ary ) { 
      if ( ind.match(re1) || _G.history_ary[ind].match(re1) ) {
          ary_his_out[ind] = _G.history_ary[ind]
      }
  }

  var his_list_num = 1;
  var out = []
  for (var ind in ary_his_out ) {

    var classname="tFile"
    if (fs.statSync(ind).isDirectory()) classname = "tDir"

    var path_disp = ind
    var name_disp = ary_his_out[ind]
    if (filter){
        path_disp = path_disp.replace(re1,sRed('$1'))
        name_disp = name_disp.replace(re1,sRed('$1'))
    }
    out.push(
      { "name": '<span class="bm_go ' + classname +'" bmlistnum="' + his_list_num + '" bmkey="' + ind + '">' +
        name_disp + '</span>',
        "path": sSilver(s80(path_disp)),
        "del": '<span class="bm_del btn" bmkey="'+ ind +'">del</span> ',
        "edit": '<span class="bl_edit btn" bmkey="' +  ind + '">edit</span>'
      })
    his_list_num++
  }
  $('#history_list').html( 'history ' + out.length + ary2html(out,'') )  
}


// 最初に人がよく使うフォルダやファイルを自動でbookmarkしておく
setInitialBookmark = function(){
  //file:  basiprofile etc/hosts  sudoer passwd
  var files =[
    '/etc/hosts' , '/etc/passwd' , '/etc/sudoers' ,

    '/var/log','/etc',
    '/Applications' , 
    '/Applications/utilities' , 
    '/Applications/iTunes.app' ,
    '/Volumes' , 
 //   '/var/spool/cron' ,

    '/Users/' + _G.username ,
    '/Users/' + _G.username + '/Desktop',
    '/Users/' + _G.username + '/Downloads',
    '/Users/' + _G.username + '/.Trash',
    '/Users/' + _G.username + '/.ssh',
    '/Users/' + _G.username + '/.bash_profile',
    '/Users/' + _G.username + '/.bash_history'
  ]

  for (var ind in files){
    setBookmark(files[ind])
  }
  toggleBookmarkList('down','')
}


//ブックマークイベント 削除 edit go
$(document).on('click','.bm_del', function(e) {
  console.log('bl_del' , e.target)
  delete　_G.bookmark_ary[$(e.target).attr('bmkey')]
  toggleBookmarkList('down','')
})
$(document).on('click','.bm_edit', function(e) {
  console.log('bm_edit' , e.target)
})
$(document).on('click','.bm_go', function(e) {
  console.log('bm_go' , e.target)
    clickBookmark( $(e.target).attr('bmkey') )
    toggleBookmarkList('up','')
    $('#mainwin').show()
})

clickBookmark = function(_path){

  //fileかdirか 

  var stat = fs.statSync(_path)
  var filepath, filename

  filepath = _path
  if (!stat.isDirectory()) {
    filename = path.basename( _path )
    filepath = path.dirname( _path )
  }

  goDir( filepath )
  console.log('_path',_path)

  if (!stat.isDirectory()) showFileContents( _path ,1)
  else clearFileContents()

}


$('#filter_bookmark').on('keyup',function(e){

  //enterなら候補1に移動  それ以外のキーなら再フィルタ
  if (e.which ==13) { 
      clickBookmark($('span[bmlistnum=1]').attr('bmkey'))
      toggleBookmarkList('up','')
      $('#mainwin').show()
  }else{
    toggleBookmarkList('down',$('#filter_bookmark').val())
  }
})

