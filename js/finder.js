
setDirSize = function(){
    osRunCb('du -d0 -h',function(ret_ary){
        $('#dir_size').html(ret_ary.join(''))
    })
}

toggleFindgrep = function(updown){

  if (!updown.match(/(up|down|toggle)/)) alert('updown not up or down')

  if (updown == 'toggle' ){
    if ($('#findgrep').css('display') == 'block')  updown = 'up'
    else  updown = 'down'
  }
  if (updown == 'up'){
      $('#findgrep').slideUp(10)
      return
  }

  //あとはdown
  $('#findgrep').slideDown(10)
  $('#filter').focus()
}



toggleNew = function(updown ){

  if (!updown.match(/(up|down|toggle)/)) alert('updown not up or down')

  if (updown == 'toggle' ){
    if ($('#new_action').css('display') == 'block')  updown = 'up'
    else  updown = 'down'
  }
  if (updown == 'up'){
      $('#new_action').slideUp(10)
      return
  }
  //あとdown
  $('#new_action').slideDown(10)
}

setCurrentPath = function(path){
  //path = path.replace(/\/\//,'/') // ルートからのフォルダ選択でスラッシュが重なる問題の対処

  _G.history_ary[path]=path
  saveJson(_G.save_path　+ '/history.json', _G.history_ary)
  $('#filter').val('')
  $('#dir_size').html('')

  execOption.cwd = path
  ary_path = path.trim().split(/\//)

    var str_link = ""
    var c_path = ""
    //階層ごとにリンク
    for (var ind in ary_path){
        if (ind == 0 ) continue
        c_path += "/" + ary_path[ind]
        str_link += '<span class="link" onClick="goDir(\'' + c_path + '\')">' +   "/" +ary_path[ind]  + '</span>'
    }
    $('#current').html( str_link )
    _G.current_path = c_path
    $("#filter").focus()
}

clearFileContents = function(){
    //ファイル内容ペーン消す
    $('#file_name').html('')
    $('#file_contents').html('')

}

showFileContents = function(fname){

    console.log('showFileContents fname',fname)
    if (fname == undefined || fname =="") alert('showFileContents fname ' + fname)

    //ファイル内容ペーン消す
    $('#file_name').html('')
    $('#file_contents').html('')

    $('#file_name').html( fname )

  //画像なら
  if (fname.match(/(.png|.jpeg|.jpg|.gif)$/)){
    $('#file_contents').html('<img src="' + fname + '" />')
    return 
  }
  //画像以外
  osRunOut("cat '" + fname + "' | head -c 10000" , 'file_contents','replace' )


}


goDir = function(path){

  console.log('goDir ' + path)

  if ( path == undefined) return;
  setCurrentPath(path)
  showFilelist(_G.current_path,'')
  $('#mainwin').show()
}

makeFile= function(filename){
    var cmd = "echo '' > " + _G.current_path + "/" + filename
    osrun(cmd ,function(){
      console.log(filename)
      goDir(_G.current_path)
    })
}
makeDir =function(dirname){
    var cmd = "mkdir " + _G.current_path + "/" + dirname
    osrun(cmd ,function(){
      console.log(dirname)
      goDir(_G.current_path)
    })
}

openFinder = function(path){
  osrun("open '" + path + "'",null)
}

termOpen = function(path){
  console.log(path)
  osrun("open -a /Applications/iTerm.app",null)
}

getExtList = function(dir){


  var shell = "ls -A '" + dir + "'"
  osRunCb(shell,
    function(filelist_ary){

        var ext_ct = []
        var node_ct = 0
        for (var ind in filelist_ary){     
            var fullpath =   dir + "/" +  filelist_ary[ind]
            var stat = fs.statSync( fullpath)
            if (stat.isDirectory()) node_ct.dir++

            //拡張子統計
            if (stat.isFile()) {
                node_ct.file++
                var ext = path.extname(fullpath)
                if (!ext_ct[ ext ]) ext_ct[ ext ] = 0
                ext_ct[ ext ]++
            }
        }

        var ext_str = ""
        for (var ind2 in ext_ct){
          ext_str += '<span onMouseOver=" showFilelist(_G.current_path,\'' + ind2 + '\') ">' + 
                    ind2 + '</span>' + sRed(ext_ct[ind2]) + " "   
        }
        $('#file_count').html(node_ct.file + ' ' + ext_str) 
    })

}

showFilelist = function(dir,filter){
  console.log(dir,filter)

  getExtList(dir)

  //シェル文字列組み立て
  var shell = "ls -A '" + dir + "'"
  if (filter) shell += " | egrep -i '" + filter + "'"

  //シェル実行
  osRunCb(shell,
    function(filelist_ary){
      var node_ct = { file:0, dir:0 };
      var ext_ct = { };
      var files_ret = [];  //戻り配列

      for (var ind in filelist_ary){
          //fillpath
          files_ret[ind] = dir + "/" + filelist_ary[ind]
          var stat = fs.statSync(files_ret[ind])
          if (stat.isDirectory()) node_ct.dir++

          //拡張子統計
          if (stat.isFile()) {
              node_ct.file++
              var ext = path.extname(files_ret[ind])
              if (!ext_ct[ ext ]) ext_ct[ ext ] = 0
              ext_ct[ ext ]++
          }
      }



      //表示方法切り替え 画像サムネイル　シンプル ls-s (detail)
      //listThumb(shell,filter,files_ret,node_ct,ext_ct)
      //listInner(shell,filter,files_ret,node_ct,ext_ct)
      //listDetail(shell,filter,files_ret,node_ct,ext_ct)
      listSimple(shell,filter,files_ret,node_ct,ext_ct)
    }
  )
}

listDetail = function(shell,filter,files_ret,node_ct,ext_ct) {}

trimStr = function(str){
  if (str.length > 20) return str.slice(0,14) + ".." + path.extname(str)
  return str
}

//ファイル一覧をシンプルに表示
listSimple = function(shell,filter,files_ret,node_ct,ext_ct) {

  var re1 = new RegExp( '(' + filter + ')', 'gi')

  var filelist_outstr =""
  for (var ind in files_ret){
      var stat = fs.statSync(files_ret[ind])

      var filename_disp = path.basename(files_ret[ind])
      if (filter) filename_disp = filename_disp.replace(re1,sRed('$1'))

      if ( stat.isDirectory() ) {
          filename_disp = 
              '<span class="tDir" onClick="goDir(_G.current_path + \'' + '/' + path.basename(files_ret[ind]) + '\')">' + 
              trimStr(filename_disp) + '</span> '
      }                         
      if (stat.isFile()) {
          filename_disp = '<span class="tFile" bmkey="' + files_ret[ind] + '" >' + trimStr(filename_disp) + '</span>'
      }
      filelist_outstr += filename_disp + '<br/>'
  }

  $('#filter_shell').html( sSilver(shell) + ' ' + sCrimson(files_ret.length))


  //拡張子
  console.log('ext' , ext_ct)



  $('#dir_count').html(node_ct.dir)
  $('#file_list').html( filelist_outstr )
}


listThumb = function(shell,filter,files_ret,node_ct,ext_ct) {
  var filelist_outstr =""
  for (var ind in files_ret){
    var filename_disp = files_ret[ind].filename
    if (filter) filename_disp = files_ret[ind].filename.replace(re1,sRed('$1'))

    if (files_ret[ind].stat.isDirectory()) {

    }
    var ext = ""
    if (files_ret[ind].stat.isFile()) {
        filename_disp = ""
    }
    if ( files_ret[ind].ext.match(/(jpg|jpeg|png|gif|tiff)/i) ) filelist_outstr += '<img  height=70 src="file://' + files_ret[ind] + '"/> &nbsp;'
  }
  console.log(ext_ct)

  $('#filter_shell').html( sSilver(shell) + ' ' + sCrimson(files_ret.length))
  $('#dir_count').html(node_ct.dir)

  $('#file_list').html( filelist_outstr )
}

//中身も表示
listInner = function(shell,filter,files_ret,node_ct,ext_ct) {
  var filelist_outstr =""
  for (var ind in files_ret){
      var filename_disp = files_ret[ind].filename
      if (filter) filename_disp = files_ret[ind].filename.replace(new RegExp( filter , 'gi'),sRed(filter))

      if (files_ret[ind].stat.isDirectory()) {
          filename_disp = '<a onClick="goDir(_G.current_path + \'' + '/' + files_ret[ind].filename + '\')" href="javascript:void(0);">' + sBold(sDodgerblue(filename_disp)) + '</a> ' +
                          sSilver(' + ')
      }
      var ext = ""
      if (files_ret[ind].stat.isFile()) {
          filename_disp = filename_disp
      }
      filelist_outstr += filename_disp + '<br/>'

      //テキストや画像の中身も表示
      if (files_ret[ind].stat.isFile()) {
          if ( files_ret[ind].ext.match(/(jpg|jpeg|png|gif|tiff)/i) ) filelist_outstr += '<img  height=70 src="file://' + files_ret[ind].fullpath + '"/><br/>'
          if ( files_ret[ind].ext.match(/(html|htm|js|coffee|php|rb|py|txt|xml|yaml|webloc|cpp|h|json|lua|plist|log|md)$/i)
              || files_ret[ind].filename.substr(0,1) == "." ) {
              var filetext = fs.readFileSync(files_ret[ind].fullpath,'utf-8').substr(0,500)
              var htmlencoded = $('<div/>').text(filetext).html()
              filelist_outstr += '<div style="margin-left:10px; margin-top:3px; font-size:70%;" >' + sSilver(htmlencoded) + '</div>'
          }
      }
  }


  $('#filter_shell').html()

  $('#filter_shell').html( sSilver(shell) + ' ' + sCrimson(files_ret.length))

  $('#dir_count').html(node_ct.dir)

  $('#file_list').html( filelist_outstr )
}

getImageTagList = function(files_ret){

  filelist_outstr = ""
  for (var ind in files_ret){
      if (files_ret[ind].stat.isFile()) {
          if ( files_ret[ind].ext.match(/(jpg|jpeg|png|gif|tiff)/i) ) {
            filelist_outstr += '<img  height=70 title="' + files_ret[ind].replace(/aa/) + '" src="file://' + files_ret[ind] + '"/>'
          }
      }
  }

}


