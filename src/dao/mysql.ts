import { createPool, Pool } from "mysql";
import { iConfigDB } from "../interface";

export let _Pool: Pool;

export function connect (config: iConfigDB): Promise<Boolean> {
    
  return new Promise((resolve)=>{
    _Pool = createPool(config);

    _Pool.getConnection((err, conexao)=>{

      if(err){
        console.log("Conexão falhou");
        resolve(false);
      } else {
        console.log("Conexão realizada com sucesso");
        resolve(true);
      }

    });

  });

}

export function disconnect (): Promise<Boolean>{
return new Promise((resolve)=>{

  if(_Pool){
    _Pool.end;
    console.log("Conexão encerrada");
  }

  resolve(true);
});

}