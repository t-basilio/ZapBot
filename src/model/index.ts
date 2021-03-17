import { selectOne } from "../dao/daoMysql";
import { iBase } from "../interface";

export abstract class Base implements iBase {
    _id: number = 0;
    abstract nome_tabela: string;

    populate(value: iBase){
        Object.assign(this, value);
    }

    findOne(id: number): Promise<void> {
        return new Promise(async (resolve)=>{
            let obj =  await selectOne(this, id);
            this.populate(obj);
            resolve();    
        });
        
    }

}

export class Volunteer extends Base{
    nome_tabela = "volunteer";
    nome = "";
    numero = 0;
    email = "";
}

