import { _decorator, Color, Component, instantiate, Node, Prefab, Sprite, v3, Vec3 } from 'cc';


const { ccclass, property } = _decorator;
@ccclass('Test')
export class Test extends Component {
    @property(Prefab)
    pointPre:Prefab = undefined;

    @property([Node])
    rect:Node[] = [];

    start(){
        for(let i = 0; i<this.rect.length-1;i++){
            let j = i+1;

            let pos1 = this.rect[i].getPosition();
            let pos2 = this.rect[j].getPosition();
            
            let radian = Math.atan2(pos2.y - pos1.y,pos2.x-pos1.x);
            let angle =  radian*180/Math.PI;
            console.log(angle);
            // let rad1 = (angle)*Math.PI/180;
            // let rad2 = (-angle)*Math.PI/180;
            // let rad1 = Math.PI/2;//up
            // let rad2 = -Math.PI/2;//down
            
            // this._addPointNode(rad1,pos2,Color.RED);
            // this._addPointNode(rad2,pos2,Color.YELLOW);
            let xx = pos2.x;
            let yy = pos2.y +20;
            let xx2 = pos2.x;
            let yy2 = pos2.y - 20;
            if(Math.abs(angle)>45){
                xx = pos2.x +20;
                yy = pos2.y -20;
                xx2 = pos2.x -20;
                yy2 = pos2.y +20;
            }
            this._addPointNode1(xx,yy,Color.RED);
            this._addPointNode1(xx2,yy2,Color.YELLOW);
        }
    }

    private _addPointNode1(xx:number,yy:number,cl:Color){
        let v3 = new Vec3(xx,yy);
        
        let pointNode = instantiate(this.pointPre);
        pointNode.getComponent(Sprite).color = cl;
        this.node.addChild(pointNode);
        pointNode.setPosition(v3);
    }
    private _addPointNode(rad:number,pos:Vec3,cl:Color){
        let xx = Math.cos(rad)*20 + pos.x;
        let yy = Math.sign(rad)*20 + pos.y;
        let v3 = new Vec3(xx,yy);
        
        let pointNode = instantiate(this.pointPre);
        pointNode.getComponent(Sprite).color = cl;
        this.node.addChild(pointNode);
        pointNode.setPosition(v3);
    }
}
