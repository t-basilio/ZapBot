import { connect, disconnect } from "./dao/mysql";
import { Volunteer } from "./model";
import { create, Whatsapp } from "venom-bot";
import express, { Request, Response } from "express";
import { google } from "googleapis";
const keys  = require("../client_secret.json");


const PORT = process.env.PORT || 8091;

const app = express();
app.listen(PORT, () => console.log("Servidor iniciado na porta " + PORT));

try {
    (async() => {
         /*await connect({ 
             host: "127.0.0.1",
             user: "root",
             password: "18052010",
             database: "mini_orm"
         }); */

        var venon =  await create("ChatBot");
  
        // credencias de conexão
        const client = new google.auth.JWT(
            keys.client_email,
            undefined,
            keys.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']  
        )

        // conectar a planilha
        client.authorize(function(err, tokens){
            if(err){
                console.log(err);
            } else {
                console.log('Connected!');
                
            }           
        });

        // Requisição para mandar mensagens
        app.get('/message', (req: Request, res: Response) => {
            let range = String(req.query.range);
            let msg = String(req.query.msg)

            /*** manipulando o google sheets */    
            var dadosPlanilha;
            dadosPlanilha = obterDadosPlanilha(client, range);
            
            dadosPlanilha.then(dados =>{

                var arrayContacts = dados.data.values;
                enviarWhats(venon, arrayContacts, msg);

            }).catch(err =>{
                console.log(err);
            })
        

            res.json({
                range: range
            })
        
            var contacts = obterDadosPlanilha(client, range);
            contacts.then(dados =>{
                interacaoZapBot(venon, dados, client);
        });
           
    });      
        
    })();

} catch (error) {
    //disconnect();
}

 

function obterDadosPlanilha(cl:any, range: string) {
    return new Promise<any>((resolve, reject) =>{
        const gsapi = google.sheets({ version:'v4', auth:cl});

        // objeto contendo o id da planilha e o range de celulas
        const opt = {
            spreadsheetId: '1YZt7OVjSVmCXTqV3EZwgGkEWoYQ3EfOLbQ50vAz8a6A',
            range: range 
        };

        //obtendo os dados
        let dataSheet =  gsapi.spreadsheets.values.get(opt);
        if(dataSheet != null){
            resolve(dataSheet);
        } else{
            reject("Não há dados");
        }
        
    }); 
} 

function escreverDadosPlanilha(cl:any, range: string, newContatcts:any) {

    return new Promise<any>((resolve, reject) =>{
        const gsapi = google.sheets({ version:'v4', auth:cl});

        // objeto contendo o id da planilha e o range de celulas
        
        const updateOpt = {
            spreadsheetId: '1YZt7OVjSVmCXTqV3EZwgGkEWoYQ3EfOLbQ50vAz8a6A',
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: newContatcts } 
            };
            
            let res =  gsapi.spreadsheets.values.update(updateOpt);

            if(res != null){
                resolve(res);
            } else {
                reject("Não há dados");
            }
    });
}
 

 /*** interação com o ZAPBOT */ 
 function enviarWhats(whats: Whatsapp, arrayContacts:any, msg:string){

    let names = [];
    let numbers = [];

    for(var i = 0; i < arrayContacts.length; i++){
        names.push(arrayContacts[i][0]);
        numbers.push('55' + arrayContacts[i][1] + '@c.us');
        whats.sendText(numbers[i], 'Olá '+ names[i] + msg);
    }
 }
    
 //Bate papo interativo
function interacaoZapBot(whats: Whatsapp, arrayContacts: any, client:any) {
    var contacts = arrayContacts.data.values;

    contacts.map(function(r:any){
        return r.push("ND");
    });

    whats.onMessage((message)=>{
   
        if(String(message.body).toUpperCase() == "SIM"){
            let nome = message.sender.pushname;
            let numero = String(message.from).split('@')[0];
            let email;
            var parse_email = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+\.([a-z]+)?$/i;

            for(let i = 0; i < contacts.length; i++){
                console.log(String(contacts[i][1]));

                if(numero.includes(String(contacts[i][1]))){
                    contacts[i][2] = "CONFIRMADO";
                }
            }

            //Escrevendo enviados nas celulas
            var escreverDados = escreverDadosPlanilha(client, 'A2', contacts);
            escreverDados.then(dados => {
                console.log(dados);

            }).catch(err => {
                console.log(err);
            });
            
            whats.sendText(message.from, ' Muito obrigado pela confirmação '+nome+'!');
            return;
        }
        
        if (String(message.body).toUpperCase() == "NÃO" || String(message.body).toUpperCase() == "NAO") {
            let nome = message.sender.pushname;
            whats.sendText(message.from, ' Que Pena '+nome+'! Te desejo um ótimo dia');
            return;
        }

        whats.sendText(message.from, 'Olá, sou uma atendente virtual da ONG CPM Monte Azul.'+
        '\nPoderia comfimar sua participação?');
        
    }) 

} 