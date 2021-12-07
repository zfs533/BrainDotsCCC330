import {
    _decorator,
    Color,
    Component,
    ERigidBody2DType,
    Graphics,
    instantiate,
    Node,
    PhysicsSystem2D,
    PolygonCollider2D,
    Prefab,
    RigidBody2D,
    Sprite,
    UITransformComponent,
    v2,
    v3,
    Vec2,
    Vec3,
} from 'cc';


const { ccclass, property } = _decorator;

@ccclass('Graphicss')
export class Graphicss extends Component {
    @property(Number)
    debug:number = 0;

    @property(Prefab)
    pointPre:Prefab = undefined;

    @property(Prefab)
    tag:Prefab = undefined;

    @property(Prefab)
    linePre:Prefab = undefined;

    @property(Node)
    touchNode:Node = undefined;

    private _uiTransform:UITransformComponent = undefined;
    private _startPos:Vec3 = null;
    private _drawNode:Node = null;
    private _posList:Vec2[] = [];
    private _isTouchMoving:boolean = false;

    onLoad(){
        PhysicsSystem2D.instance.debugDrawFlags = this.debug;
        this._uiTransform = this.node.getComponent(UITransformComponent);
        this.touchNode.on(Node.EventType.TOUCH_START,this._touchStart,this);
        this.touchNode.on(Node.EventType.TOUCH_MOVE,this._touchMove,this);
        this.touchNode.on(Node.EventType.TOUCH_END,this._touchEnd,this);
        this.touchNode.on(Node.EventType.TOUCH_CANCEL,this._touchEnd,this);
        this.schedule(()=>{
            let dt = instantiate(this.tag);
            dt.getComponent(Sprite).color = new Color(Math.random()*255,Math.random()*255,Math.random()*255,255);
            dt.setPosition(new Vec3(Math.random()*300 -150,300,0));
            this.touchNode.addChild(dt);
        },5);
    }

    private _touchStart(evt:any){
        this._posList.splice(0);
        let touchPos = new Vec3(evt.getUILocation().x,evt.getUILocation().y);
        let pos : Vec3 = this._uiTransform.convertToNodeSpaceAR(touchPos);
        this._startPos = pos;
        let node = instantiate(this.linePre);
        this._drawNode = node;
        this.touchNode.addChild(this._drawNode);
        this._posList.push(this._getV2Pos(pos));
    }

    private _tempPos = null;
    private _touchMove(evt:any){
        this._isTouchMoving = true;
        let touchPos = new Vec3(evt.getUILocation().x,evt.getUILocation().y);
        let pos : Vec3 = this._uiTransform.convertToNodeSpaceAR(touchPos);
        if(!this._tempPos){
            this._tempPos = pos;
        }
        else{
            let distance = Vec2.distance(this._tempPos,pos);
            //忽略掉相隔太近的点
            if(distance>=5){
                distance = this._jugement(pos);
                if(distance>=5){
                    this._posList.push(this._getV2Pos(pos));
                    this._tempPos = pos;
                }
            }
        }
        //画线
        let g = this._drawNode.getComponent(Graphics);
        g.fillColor.fromHEX('#ff0000');
        g.moveTo(this._startPos.x,this._startPos.y);
        g.lineTo(pos.x,pos.y);
        g.close();
        g.stroke();
        this._startPos = pos;
    }
    
    private async _touchEnd(evt:any){
        let touchPos = new Vec3(evt.getUILocation().x,evt.getUILocation().y);
        let pos : Vec3 = this._uiTransform.convertToNodeSpaceAR(touchPos);
        if(!this._isTouchMoving){
            let dt = instantiate(this.tag);
            dt.getComponent(Sprite).color = new Color(Math.random()*255,Math.random()*255,Math.random()*255,255);
            dt.setPosition(pos);
            this.touchNode.addChild(dt);
            return;
        }
        this._isTouchMoving = false;
        // let listPos:Vec2[] = [
        //     v2(0,0),
        //     v2(20,20),
        //     v2(40,0),
        //     v2(20,-20),
        // ];
        this._handlePointList();
        try {
            this._addPhisicComponent(this._drawNode);
        } catch (error) {
            console.log(error);
            this._drawNode.destroy();
        }
    }

    /**
     * 添加刚体和碰撞器
     * @param g 
     * @param listPos 
     */
    private _addPhisicComponent(g:Node){
        //加刚体
        g.addComponent(RigidBody2D)
        let rb = g.getComponent(RigidBody2D);
        rb.gravityScale = 1;
        rb.type = ERigidBody2DType.Dynamic;
        rb.wakeUp();

        //加碰撞器
        g.addComponent(PolygonCollider2D);
        let bc = g.getComponent(PolygonCollider2D);
        bc.density = 1;
        bc.friction = 0.2;
        bc.restitution = 0.5;
        if(this._posList.length<3 && this._posList.length>0){
            let dis = 3;
            let pos = this._posList[0];
            console.log(pos);
            //画太短，加个默认的形状
            bc.points = [
                v2(pos.x-dis,pos.y+dis),
                v2(pos.x+dis,pos.y+dis),
                v2(pos.x+dis,pos.y-dis),
                v2(pos.x-dis,pos.y-dis),
            ]
        }
        else{
            bc.points = this._posList;
        }
        bc.apply();
    }

    _getV2Pos(pos:Vec3){
        return v2(pos.x,pos.y);
    }
    
    /**
     * 测距
     * @param pos 
     * @returns 
     */
    _jugement(pos:Vec3){
        let distance = 100;
        for(let i = 0; i<this._posList.length;i++){
            let dis = Vec2.distance(pos,v3(this._posList[i].x,this._posList[i].y));
            distance = dis<distance ? dis : distance;
        }
        return distance;
    }
    
    /**
     * 将线上的点转换成围绕线一圈的点
     */
    private _handlePointList(){
        let dis = 5;
        let firstDis = 0;
        let pointOne = this._posList[0];
        //第一个点朝后拉
        let temp = [
            v2(pointOne.x-dis,pointOne.y+dis),
        ];
        let temp1 = [];
        for(let i = 0; i<this._posList.length-1;i++){
            let j = i+1;
            let pos1 = this._posList[i];
            let pos2 = this._posList[j];
            
            let disx = Math.floor(pos2.x - pos1.x);
            let disy = Math.floor(pos2.y - pos1.y);
            if(i == 0){//用第一个测距来判断走向
                firstDis = disx;
            }
            // console.log('disx: '+disx+"   disy: "+disy); 
            let top =  v2(pos2.x,pos2.y);
            let down = v2(pos2.x,pos2.y);
            if(firstDis>0){//朝右
                let pData = this._handleAroundPointRight(top,down,disx,disy);
                temp.push(pData.top);
                temp1.push(pData.down);
            }
            else{
                disx = -disx;
                let pData = this._handleAroundPointLeft(top,down,disx,disy);
                temp.push(pData.top);
                temp1.push(pData.down);
            }
        }
        /* 将挨的太近的点移除 */
        this._deleteDuplicates(temp);
        this._deleteDuplicates(temp1);
        //线下面的点反转形成包围
        temp1 = temp1.reverse();
        this._posList = temp.concat(temp1);
        /* 将挨的太近的点移除 */
        this._deleteDuplicates(this._posList);

        if(this.debug){
            temp.forEach(item=>{
                let nd = instantiate(this.pointPre);
                nd.getComponent(Sprite).color = Color.BLUE;
                nd.setPosition(new Vec3(item.x,item.y));
                this._drawNode.addChild(nd);
            })
            temp1.forEach(item=>{
                let nd = instantiate(this.pointPre);
                nd.getComponent(Sprite).color = Color.YELLOW;
                nd.setPosition(new Vec3(item.x,item.y));
                this._drawNode.addChild(nd);
            })
        }
    }

    private _handleAroundPointLeft(top:Vec2,down:Vec2,disx:number,disy:number):{top:Vec2,down:Vec2}{
        let dis = 5;
        if(disx >= 5){
            top.y+=dis;
            down.y-=dis;
        }
        else if(disx >= 0 && disx<5){
            if(disy<0){//朝下
                top.x-=dis;
                down.x+=dis;
            }
            else{//朝上
                top.x+=dis;
                down.x-=dis;
            }
        }
        else{
            if(disx <= -5){
                top.y-=dis;
                down.y+=dis;
            }
            else{
                if(disy<0){//朝下
                    top.x-=dis;
                    down.x+=dis;
                }
                else{//朝上
                    top.x+=dis;
                    down.x-=dis;
                }
            }
        }
        return {top:top,down:down}
    }
    
    private _handleAroundPointRight(top:Vec2,down:Vec2,disx:number,disy:number):{top:Vec2,down:Vec2}{
        let dis = 5;
        if(disx >= 5){
            top.y+=dis;
            down.y-=dis;
        }
        else if(disx >= 0 && disx<5){
            if(disy<0){//朝下
                top.x+=dis;
                down.x-=dis;
            }
            else{//朝上
                top.x-=dis;
                down.x+=dis;
            }
        }
        else{
            if(disx <= -5){
                top.y-=dis;
                down.y+=dis;
            }
            else{
                if(disy<0){//朝下
                    top.x+=dis;
                    down.x-=dis;
                }
                else{//朝上
                    top.x-=dis;
                    down.x+=dis;
                }
            }
        }
        return {top:top,down:down}
    }

    /**
     * 将挨的太近的点移除
     * @param temp 
     */
    _deleteDuplicates(temp:any[]){
        let bool = true;
        do {
            let len = 0;
            for(let i = 0; i<temp.length-1;i++){
                let j = i+1;
                len = j;
                let distance = Vec3.distance(v3(temp[i].x,temp[i].y,0),v3(temp[j].x,temp[j].y,0));
                if(distance<5.5){
                    temp.splice(i,1);
                    bool = true;
                    break;
                }
                else if(j == temp.length -1){
                    bool = false;
                }
            }
            if(temp.length <= 1)bool = false;
        }
        while(bool);
    }
}
