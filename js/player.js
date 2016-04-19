var app = angular.module("audioPlayer",[]);
/*
 q = 关键字
 */
var songSearch = 'http://so.ard.iyyin.com/s/song_with_out?page=1&size=50&q=';
/*
 title = 歌曲名
 song_id = 歌曲ID
 */
var songLrc = 'http://lp.music.ttpod.com/lrc/down?lrcid=&title=';
/*
 artist = 歌手名
 */
var pic = 'http://lp.music.ttpod.com/pic/down?artist=';

app.controller('playerController',['$scope','$timeout','audio','player', 'songService',function($scope,$timeout,audio,player,songService) {
    $scope.audio = audio;
    $scope.player = player;

    var timeout;
    $scope.$watch('keyword', function(newKeyword) {
        if(!newKeyword) newKeyword = "黄家驹";
        if(newKeyword){
            if(timeout) $timeout.cancel(timeout);
            timeout = $timeout(function(){
                songService.search(newKeyword).success(function(data, status) {
                    $scope.songs =$scope.player.list= data.data;
                })
            },200);
        }
    });



    /*
     $http({
     method : 'JSONP',
     url : MP3url
     })
     .success(function(data,status){
     console.log(status);
     console.log(data);
     $scope.songs = data.result.songs;
     })
     .error(function(data,status){
     console.log(status);
     console.log(data)
     })
     */
}]);

app.directive('songLink', ['player',function(player) {

    return {
        restrict: 'AE',
        require: ['^ngModel'],
        replace: true,
        scope: {
            ngModel: '=',
            play: '&'
        },
        templateUrl: 'list.html',
        link: function(scope, ele, attr) {
            ele.find(".showview").on("click",function(e){
                e.stopPropagation();
                console.log(player.list[scope.$parent.$index].viewed)
                var like = Boolean(scope.ngModel.like);
                scope.ngModel.like = player.list[scope.$parent.$index].like = !like;
                scope.ngModel.viewed = player.list[scope.$parent.$index].viewed = true;
                console.log(player.list[scope.$parent.$index].viewed)
            });
        }
    };
}]);
app.factory('songService',['$http',function($http){
    var doRequest = function(keyword){
        return $http({
            method : "JSONP",
            url :songSearch + keyword +"&callback=JSON_CALLBACK"
        })
    };
    return {
        search:function(keyword){
            return doRequest(keyword)
        }
    }
}]);
app.factory('picService',['$http',function($http){
    var doRequest = function(keyword){
        return $http({
            method : "JSONP",
            url :pic + keyword +"&callback=JSON_CALLBACK"
        })
    };
    return {
        search:function(keyword){
            return doRequest(keyword)
        }
    }
}]);
app.factory('lrcService',['$http',function($http){
    var doRequest = function(song_name,artist,song_id){
        return $http({
            method : "JSONP",
            url :songLrc + song_name +"&artist="+ artist +"&song_id="+ song_id +"&callback=JSON_CALLBACK"
        })
    };
    return {
        search:function(song_name,artist,song_id){
            return doRequest(song_name,artist,song_id)
        }
    }
}]);
app.factory('audio',['$document',function($document){
    var audio = $document[0].getElementById("audio");
    return audio;
}]);
app.factory('player', ['audio','$rootScope','picService', function(audio,$rootScope,picService) {
    var player = {
        playing:false,
        current: {
            index:0
        },
        buffer:0,
        volumes:1,
        ready: false,
        readys: '',
        play: function (song,index) {
            if(player.current.song){
                if(song.song_id == player.current.song.song_id){
                    player.playing?audio.pause():audio.play();
                    return false;
                }
            }
            if(index)player.current.index = index;
            if(!song && !player.current.song)song = player.list[0];
            //console.log(song)

            if(song){
                //console.log(song)

                song.viewed = true;
                player.readys='show';
                if(player.playing) player.stop();
                song.pic ="images/opacity1.png";
                picService.search(song.singer_name).success(function(data, status) {
                    if(data.data){
                        song.pic = data.data.singerPic;
                    }
                });
                player.current.song = song;
                audio.src = song.audition_list[0].url;
                player.duration = song.audition_list[0].duration;
            }else{

            }
            //console.log(player.current.song)
            audio.play();
            player.playing = true;
            player.current.class = "playState";
        },
        playNext:function(){
            var next  =Math.min(player.current.index+1,player.list.length);
            player.current.index = next;
            this.play(player.list[next]);
            console.log(player.current.index,player.list.length)
        },
        playPre:function(){
            var pre  = Math.max(player.current.index-1,0);
            player.current.index = pre;
            this.play(player.list[pre])
        },
        stop: function() {
            if (player.playing) {
                audio.pause();
                player.ready = player.playing = false;
                player.current.class = "pauseState";
                //player.current = null;
            }
        },
        mutes:function(){
            if( audio.volume){
                audio.volume = 0;
            }else{
                audio.volume = this.volumes;
            }
        },
        currentTime: function() {
            var t = audio.currentTime || 0;
            var minute = 0, second = 0;
            minute=Math.floor(t/60%60);
            second=Math.floor(t%60);
            if(minute<10){
                minute = "0" + minute;
            }
            if(second<10){
                second = "0" + second;
            }
            return minute+":"+second;
        },
        currentDuration: function() {
            return parseInt(audio.duration);
        },
        showViewed:function(){
            var viewed = document.getElementById("listNew");
            var view_style = viewed.style.display;
            if(view_style == ""){
                document.getElementById("listNew").style.display="none"
            }else{
                document.getElementById("listNew").style.display=""
            }
        },
        fav:function(index,$event){
            //console.log(index)
            if($event){
                $event.stopPropagation();
            }
            console.log(index)
            if(index>-1){
                if(Boolean(player.list[index].like)){
                    player.list[index].like = false;
                }else{
                    player.list[index].like = true;
                    player.list[index].viewed = true;
                }

            }else{
                if(Boolean(player.current.like)){
                    player.current.like = player.list[player.current.index].like = false;
                }else{
                    player.current.like = player.list[player.current.index].like = true;
                    //console.log(player.list[index])
                    //player.list[index].viewed = true;
                }
            }
        },
        reView:function(index,$event){
            if($event){
                $event.stopPropagation();
            }
            player.list[index].viewed = player.list[index].like = false;

        }
    };
    audio.addEventListener('ended',function(){
        $rootScope.$apply(function(){
            player.stop();
            player.current.class="";
        })
    });



    scale = function (btn, bar, title) {
        this.btn = document.getElementById(btn);
        this.bar = document.getElementById(bar);
        this.step = document.getElementById(title);
        //this.step = this.bar.getElementsByTagName("DIV")[0];
        this.init();
    };
    scale.prototype = {
        init: function () {
            var f = this, g = document, b = window, m = Math;
            f.bar.onclick = function(e){
                e.stopPropagation();
                var x = (e || b.event).clientX;
                var l = this.offsetLeft;
                var max = this.offsetWidth;
                console.log((x-l),max)
                if(f.bar.id == "progressBar"){
                    audio.currentTime = (x-l)/max*player.currentDuration();
                }else{
                    //console.log((x-l),max)

                    audio.volume = player.volumes = m.min((x-l)/max,1);
                }

               // f.step.style.width = Math.max(0, (x-l)/max*100) + '%';
            };
            f.btn.onmousedown = function (e) {
                f.bar.id == "progressBar"?audio.pause():"";
                var x = (e || b.event).clientX;
                var l = this.offsetLeft;
                var max = f.bar.offsetWidth;
                //console.log(l)
                g.onmousemove = function (e) {
                    var thisX = (e || b.event).clientX;
                    var to = m.min(max, m.max(0,  (thisX - f.bar.offsetLeft)));
                    //f.btn.style.left = to + 'px';
                    f.ondrag(m.max(0, to / max) * 100, to);
                    b.getSelection ? b.getSelection().removeAllRanges() : g.selection.empty();
                };
                g.onmouseup = function(){
                    this.onmousemove=null;
                    this.onmouseup=null;
                    f.bar.id == "progressBar"?audio.play():"";
                };
            };
        },
        ondrag: function (pos, x) {
            //this.step.style.width = Math.max(0, x) + 'px';
            //console.log(pos)
            this.step.style.width = Math.max(0, pos) + '%';
            //console.log(pos);
            if(this.bar.id == "progressBar"){
                audio.currentTime = pos*player.currentDuration()/100;
                audio.pause();
            }else{
                audio.volume = player.volumes = pos/100;
                //player.volume = pos/100;
            }
            //this.title.innerHTML = pos / 10 + '';
        }
    };
    audio.addEventListener('play',function(){
        $rootScope.$apply(function(){
            player.playing = true;
        });
    });
    audio.addEventListener('pause',function(){
        $rootScope.$apply(function(){
            player.playing = false;
        });
    });
    audio.addEventListener('progress',function(){
        var buffer;
        if(this.buffered.length){
            buffer = this.buffered.end(0) / this.duration*100;
        }else{
            buffer = 0;
        }
        $rootScope.$apply(function(){
            player.buffer = buffer;
        });
    });
    audio.addEventListener('timeupdate', function(evt) {
        $rootScope.$apply(function() {
            player.progress = player.currentTime();
            player.progress_percent = audio.currentTime / player.currentDuration();
        });
        var lyric = player.lrc;
        var lyricContainer = document.getElementById('lyricContainer');
        if (!lyric) return;
        for (var i = 0, l = lyric.length; i < l; i++) {
            //console.log(this.currentTime,lyric[i][0] - 0.50)
            if (this.currentTime > lyric[i][0] - 0.50 /*preload the lyric by 0.50s*/ ) {
                //single line display mode
                // that.lyricContainer.textContent = that.lyric[i][1];
                //scroll mode
                var line = document.getElementById('line-' + i),
                    prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                prevLine.className = '';
                //randomize the color of the current line of the lyric
                line.className = 'current-line';
                lyricContainer.style.top = 130 - line.offsetTop + 'px';
            }
        }
        //console.log(player.lrc)
    });
    audio.addEventListener('volumechange',function(){
        $rootScope.$apply(function(){
            player.volume = audio.volume;
        });
    });
    audio.addEventListener('canplay', function(evt) {
        $rootScope.$apply(function() {
            player.ready = true;
            player.readys = "";
        });
        new scale('cursor', 'progressBar', 'currTimeBar');
        new scale('volume_bar', 'p_volume', 'volume_num');
    });
    return player;
}]);
app.controller('lrcController',['$scope','player','lrcService','audio', function($scope,player,lrcService,audio) {
    $scope.player = player;
    $scope.lrc_ready = false;
    $scope.$watch('player.current.song', function (song) {
        if(song){
            document.getElementById('lyricContainer').style.top="";
            lrcService.search(song.song_name,song.singer_name,song.song_id).success(function(data, status) {
                if(data.data){
                    /*
                    var lyric = data.data.lrc.split('\n'); //先按行分割
                    var _l = lyric.length; //获取歌词行数
                    var lrc = []; //新建一个数组存放最后结果
                    for(i=0;i<_l;i++) {
                        var d = lyric[i].match(/\[\d{2}:\d{2}((\.|\:)\d{2})\]/g);  //正则匹配播放时间
                        var t = lyric[i].split(d); //以时间为分割点分割每行歌词，数组最后一个为歌词正文
                        if (d != null) { //过滤掉空行等非歌词正文部分
                            //换算时间，保留两位小数
                            var dt = String(d).split(':');
                            var _t = Math.round(parseInt(dt[0].split('[')[1]) * 60 + parseFloat(dt[1].split(']')[0]) * 100) / 100;
                            lrc.push([_t, t[1]]);
                        }
                    }
                    */
                    function parseLyric(text) {
                        //get each line from the text
                        var lines = text.split('\n'),
                        //this regex mathes the time [00.12.78]
                            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
                            result = [];

                        // Get offset from lyrics
                        //Returns offset in miliseconds.
                        var offset = 0;
                        try {
                            // Pattern matches [offset:1000]
                            var offsetPattern = /\[offset:\-?\+?\d+\]/g,
                            // Get only the first match.
                                offset_line = text.match(offsetPattern)[0],
                            // Get the second part of the offset.
                                offset_str = offset_line.split(':')[1];
                            // Convert it to Int.
                            offset = parseInt(offset_str);
                        } catch (err) {
                            //alert("offset error: "+err.message);
                            offset = 0;
                        }
                        //exclude the description parts or empty parts of the lyric
                        while (!pattern.test(lines[0])) {
                            lines = lines.slice(1);
                        }
                        //remove the last empty item
                        lines[lines.length - 1].length === 0 && lines.pop();
                        //display all content on the page
                        var time=[],value=[];
                        for(var i = 0 ;i<lines.length;i++){
                             time.push(lines[i].match(pattern));
                            value.push(lines[i].replace(pattern, ''));
                            /**/

                        }
                        for(var n =0 ;n<time.length;n++){
                            var t = time[n];
                            if(t){
                                t = (time[n]+"").slice(1, -1).split(':');
                                //console.log(value[n])
                                result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value[n]]);
                            }
                        }

                        //sort the result by time
                        result.sort(function(a, b) {
                            return a[0] - b[0];
                        });
                        //console.log(result)
                        return result;
                    }
                    lrc = parseLyric(data.data.lrc)
                    $scope.lrc = player.lrc = lrc;
                    //console.log(lrc)
                }else{
                    $scope.lrc = [[[],"当前无歌词"]];
                }
                $scope.lrc_ready = true;
            });
        }

    });
}]);

app.controller('viewedController', function($scope, player) {
    $scope.viewed  = player;
    $scope.views  = [];
    //console.log(player.list)
    //var viewed = {
    //  add:function(){
    //      alert("a")
    //  }
    //};
    $scope.$watch($scope.viewed,function(newVal, oldVal){
        console.log(newVal, oldVal);
        //angular.forEach(viewed.list,function(list){
        //    console.log(list.viewed)
        //    if(list.viewed){
        //        $scope.views.push(list);
        //    }
        //    $scope.views.push(list);
        //});
        //if(player.list)console.log(player.list[0].viewed)
    });
    angular.forEach(player.list,function(list,index){

        console.log(list,index)
        //if(list.viewed){
        //    $scope.views.push(list);
        //}
        //$scope.views.push(list);
    });

    /*
    $scope.$watch('player.list',function(newVal, oldVal){
        console.log(newVal, oldVal);
        //angular.forEach(viewed.list,function(list){
        //    console.log(list.viewed)
        //    if(list.viewed){
        //        $scope.views.push(list);
        //    }
        //    $scope.views.push(list);
        //});
        //if(player.list)console.log(player.list[0].viewed)
    });*/
    console.log($scope.views)
    //console.log($scope.viewed.list)
    //$scope.$watch('player.current', function(newVal) {
    //    if (newVal) {
    //        $scope.related = [];
    //        //angular.forEach(newVal.relatedLink, function(link) {
    //        //    $scope.related.push({link: link.link[0].$text, caption: link.caption.$text});
    //        //});
    //    }
    //});
});