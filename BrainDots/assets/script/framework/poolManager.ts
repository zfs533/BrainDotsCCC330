import { _decorator, instantiate, Node, NodePool, Prefab } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PoolManager')
export class PoolManager {
    private _dictPool: any = {}
    private _dictPrefab: any = {}
    static _instance: PoolManager;

    static get Inst() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new PoolManager();
        return this._instance;
    }


    /**
     * 根据预设从对象池中获取对应节点
     */
    public async getNode(prefab: Prefab, parent: Node = null): Promise<Node> {
        return new Promise(resove => {
            let name = prefab.name;
            this._dictPrefab[name] = prefab;
            let node = null;
            if (this._dictPool.hasOwnProperty(name)) {
                //已有对应的对象池
                let pool = this._dictPool[name];
                if (pool.size() > 0) {
                    node = pool.get();
                } else {
                    node = instantiate(prefab);
                }
            } else {
                //没有对应对象池，创建他！
                let pool = new NodePool();
                this._dictPool[name] = pool;

                node = instantiate(prefab);
            }

            if (parent) {
                node.parent = parent;
            }
            if (!node) console.log('对象次获取对象异常');
            node.active = true;
            resove(node);
        });
    }

    /**
     * 将对应节点放回对象池中
     */
    public setNode(node: Node) {
        if (!node) {
            return;
        }
        let name = node.name;
        let pool = null;
        if (this._dictPool.hasOwnProperty(name)) {
            //已有对应的对象池
            pool = this._dictPool[name];
        } else {
            //没有对应对象池，创建他！
            pool = new NodePool();
            this._dictPool[name] = pool;
        }

        pool.put(node);
    }



    /**
     * 根据名称，清除对应对象池
     */
    public clearPool(name: string) {
        if (this._dictPool.hasOwnProperty(name)) {
            let pool = this._dictPool[name];
            pool.clear();
        }
    }
}