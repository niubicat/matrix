;(function(){

	// 全局变量
	var c = document.getElementById('tetris'),
		score = document.getElementById('score');
	c.setAttribute('height',420 > window.innerHeight ? window.innerHeight.toString() : '420');
	c.setAttribute('width', 240 > window.innerWidth ? window.innerWidth.toString() : '240');

	var oimgArr = {};

	var config = {
		I: -1, // 方块出现的初始行位置
		J: 6, // 方块出现的初始列位置
		SPEED: 25, // 正常速度
		FASTSPEED: 1, // 最快速度
		TIME: 40  // 40ms的刷新速度
	};

	// 入口函数
	/**
	 * @param img img对象数组
     * @param sw 屏幕适应的一个比值
     * @param fun 程序入口函数
	 */
	var loadAllImg = function(img, sw, fun){
		var l = img.length,
			i,
			h = 0;

		for(i = 0; i < l; i++){
			oimgArr[img[i]] = dlImg(img[i]); // oimgArr{img0:..., img1:...}
			oimgArr[img[i]].onload = function(){ // 异步加载
				this.width = this.width * sw;
				this.height = this.height * sw;
				h++;
				h >= l && fun(); // 所有图片加载成功后调用fun函数
			}
		}
	}

	// 公共方法
	var dlImg = function(img){ // 返回一个img对象
		var oimg = new Image();
		oimg.src = 'images/' + img;
        console.log(oimg);
		return oimg;
	}

	/**
     * @param c canvas DOM对象
     * @param imga img对象数组
     */
    var run = function(c, imga){
    	var ctx = c.getContext('2d'),
    		time = null,
    		w = parseInt(c.getAttribute('width')), // 画布宽度
    		cell = w / 12; // 单元块宽度

    	var Block = function(type){
    		var _this = this;

    		_this.type = type; // 方块类型
    		_this.i    = config.I; // 初始行位置
    		_this.j    = config.J; // 初始列位置
    		_this.speed = config.SPEED; // 初始速度
    		_this.defer = 0; // 延迟累计

    		// 根据type值初始化方块的坐标，outline属性存储坐标值
    		switch(_this.type){
    			case 1: // l字，每个单元出现的位置
    				_this.outline = [
    					{i: _this.i, j: _this.j},
    					{i: _this.i-1, j: _this.j},
    					{i: _this.i-2, j: _this.j},
    					{i: _this.i-3, j: _this.j}
    				];
    				break;
    			case 2: // 上字
                    _this.outline = [
                        {i: _this.i, j: _this.j - 1},
                        {i: _this.i - 1, j: _this.j},
                        {i: _this.i, j: _this.j},
                        {i: _this.i, j: _this.j + 1}
                    ];
                    break;
                case 3: // L字
                    _this.outline = [
                        {i: _this.i - 2, j: _this.j - 1},
                        {i: _this.i - 1, j: _this.j - 1},
                        {i: _this.i, j: _this.j - 1},
                        {i: _this.i, j: _this.j}
                    ];
                    break;
                case 4: // 田字
                    _this.outline = [
                        {i: _this.i - 1, j: _this.j - 1},
                        {i: _this.i, j: _this.j - 1},
                        {i: _this.i, j: _this.j},
                        {i: _this.i - 1, j: _this.j}
                    ];
                    break;
                case 5: // 转字
                    _this.outline = [
                        {i: _this.i - 1, j: _this.j - 1},
                        {i: _this.i, j: _this.j - 1},
                        {i: _this.i, j: _this.j},
                        {i: _this.i + 1, j: _this.j}
                    ];
                    break;
    		}

    		// 下落方块
    		_this.dropBlock = function(){
    			if(_this.defer == _this.speed){
    				_this.outline.map(function(o){
    					o.i = o.i + 1; // 行（i）坐标加1表示向下移动
    			    });
                    _this.defer = 0;
                }else{
                    _this.defer++;
                };
    		};

            // 按下方向键时，方块加速下降
            _this.speedUp = function(){
                _this.speed = 1;
                _this.defer = 0;
            };

            //准备下降
            _this.isReady = function(){
                return _this.speed == _this.defer;
            };
    	}

        var Blocks = {
            nullimg: imga['null.png'],
            cellimg: imga['cell.png'],
            pause: false, // 游戏是否暂停中
            matrix: new Array(21), // 列矩阵，-1为空，0为正在移动，1为已经存在
            block: new Block(1), // 默认第一个出现的方块类型为1
            score: 0, //分数累计

            init: function(){
                var that = this,
                    code = null;

                for(var i = 0; i < 21; i++){ // 初始化矩阵数组
                    this.matrix[i] = new Array(12);
                    for(var j = 0; j < 12; j++){
                        this.matrix[i][j] = -1;
                        ctx.drawImage(this.nullimg, j * cell, i * cell, this.nullimg.width, this.nullimg.height);          
                    }
                }

                document.onkeydown = function(e){
                    code = e.keyCode || e.which;
                    switch(code){
                        case 37: // 左
                            that.setSite(-1);
                            break;
                        case 38: // 上
                            that.rotateBlock();
                            break;
                        case 39: // 右
                            that.setSite(1);
                            break;
                        case 40: // 下，长按加速下滑
                            if(that.block.speed == config.SPEED)
                                that.block.speedUp(); // 加速
                            break;
                        case 32: // 暂停
                            !that.pause ? that.suspend() : that.start();
                            break;
                        default:
                            return false;
                    }
                };

                document.onkeyup = function(e){
                    if(e.keyCode ==  40){ // 松开下键恢复速度
                        that.block.speed = config.SPEED;
                    }
                }
            },

            start: function(){ // 开始游戏
                var that = this;
                time = setInterval(function(){
                    console.time('all');
                    that.block.dropBlock(); // 下落方块
                    that.refreshMat(); // 刷新矩阵
                    that.reachBottom(); // 检测是否到达底部或者碰到已有方块
                    console.timeEnd('all');
                }, config.TIME);

                that.pause = false;
            },

            suspend: function(){ // 暂停
                this.pause = true;
                clearInterval(time);
            },

            refreshMat: function(){ // 执行一次矩阵刷新
                var img = null,
                    that = this;

                that.block.outline.forEach(function(o){ // 将移动钱的位置都置为-1
                    if(o.i > 0 && that.matrix[o.i - 1][o.j] != 1)
                        that.matrix[o.i - 1][o.j] = -1;
                });

                that.block.outline.forEach(function(o){ // 刷新移动后的位置
                    if(o.i >= 0)
                        that.matrix[o.i][o.j] = 0;
                });

                that.matrix.forEach(function(l, i){ // 重绘矩阵
                    l.forEach(function(m, j){
                        img = (m == -1 ? that.nullimg : that.cellimg);
                        ctx.drawImage(img, j * cell, i * cell, img.width, img.height);
                    });
                });
            },

            rotatePoint: function(c, p){ // c点为旋转中心，p为旋转点，一次顺时针旋转90度，返回旋转后的坐标
                return {j: p.i - c.i + c.j, i: -p.j + c.i + c.j};
            },

            rotateBlock: function(){
                var that = this,
                    i,
                    o = null,
                    ctr = that.block.outline[1],
                    l = that.block.outline.length;

                if(that.block.type != 4){ // 田字形无法旋转
                    for(i = 0; i < l; i++){
                        o = that.rotatePoint(ctr, that.block.outline[i]);
                        if(o.j < 0 || o.j > 11 || o.i > 20) { // 旋转时不可以碰到边界
                            break;
                        }else if (o.i > 0 && o.j >= 0 && o.j <= 20 && Blocks.matrix[o.i][o.j == 1]) {
                            // 旋转时不可以已有方块的点
                            break;
                        }
                    }

                    if (i == 4) {
                        that.block.outline.forEach(function(o, i){
                            if(o.i >=0) that.matrix[o.i][o.j] = -1;
                            that.block.outline[i] = that.rotatePoint(ctr, o);
                        });
                    }
                }
            },

            setSite: function(dir){ // 设置左右移动后的位置
                var i,
                    o,
                    l = this.block.outline.length;

                for(i = 0; i < l; i++){
                    o = this.block.outline[i];
                    // 是否碰到已存在的方块，是否碰到左右边界
                    if(o.i >= 0 && ((Blocks.matrix[o.i][o.j + dir] == 1) || (o.j + dir == -1 || o.j + dir == 12))) {
                        break; // 一旦发生碰撞，就退出循环，并不执行移动操作
                    }
                }

                if(i == l){ // 当count = l时，表明移动操作没发生碰撞
                    this.block.outline.forEach(function(o){
                        if(o.i >= 0){
                            Blocks.matrix[o.i][o.j] = -1; // 将当前位置重置为-1
                            o.j = (o.j + dir == -1 || o.j + dir == 12) ? o.j : o.j + dir; // 是否允许移动，允许则将o.j+dir的值赋予o.j
                            Blocks.matrix[o.i][o.j] = 0; // 刷新最新值
                        }else{ // 小于0时（在矩阵外），也需要进行左右移动
                            o.j = (o.j + dir == -1 || o.j + dir == 12) ? o.j : o.j +dir;
                        }             
                    });
                }
            },

            reachBottom: function(){
                var that = this,
                    i,
                    j,
                    o,
                    l = that.block.outline.length;

                if(that.block.isReady()){ // 当前方块下落帧结束时，然后进行检测是否到达了底部
                    for(j = 0; j < l; j++){
                        o = that.block.outline[j];
                        if(o.i >= 0 && (o.i == 20 || that.matrix[o.i + 1][o.j] == 1)){ // 向下移动时发生碰撞
                            break; // 方块到达底部或落在其他方块上，方块停止下落，产生新的方块
                        }
                    }

                    if(j < l){ // 当方块落在底部或其他方块时，进行检测
                        for(i = 0; i< l; i++){
                            o = that.block.outline[i];
                            if(o.i >= 0){
                                that.matrix[o.i][o.j] = 1; // 方块停止后，修改矩阵数据
                            }else{
                                that.gameOver(); // 游戏结束
                                return ;
                            }
                        }

                        that.ruinMat(); // 检测是否需要爆破行，如果有则执行爆破操作
                        that.block = new Block(parseInt(Math.random() * 5) + 1);
                    }
                }
            },

            detectMat: function(){ // 检测矩阵，判断是否有连续一行，返回一个数组
                var count = 0,
                    s,
                    detecta = []; // 需要爆破的行号
                this.matrix.forEach(function(l, i){
                    for(s = 0; s < l.length; s++){
                        if(l[s] == 1) count ++; else break;
                    }

                    count == 12 && detecta.push(i);
                    count = 0;
                });
                return detecta.length == 0 ? false : detecta;
            },

            ruinMat: function(){ // 爆破连续的一行
                var dmat = this.detectMat(); // 返回整行都有方块的行号集合
                if(dmat){
                    this.score = this.score + (dmat.length == 1 ? 100 : 
                                                    dmat.length == 2 ? 250 :
                                                        dmat.length == 3 ? 450 : 700);
                    score.innerHTML = this. score.toString();
                    dmat.forEach(function(d){
                        Blocks.matrix.splice(d, 1); // 删除整行都有方块的行
                        Blocks.matrix.unshift([-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]); // 弥补被删的行
                    });
                }

                dmat = null;
            },

            gameOver: function(){
                clearInterval(time);
                alert('You have been dead !');
            }
        };

        Blocks.init();
        Blocks.start();
    }


	// 调用入口函数
	loadAllImg(['null.png', 'cell.png'],
		parseInt(c.getAttribute('width')) / 240, 
        function(){
			run(c, oimgArr);
		}
	);
    console.log(1);
})();