import mysql  from 'mysql';

import ConnectionFailException from "../core/exceptions/ConnectionFailException";
import QueryFailException from "../core/exceptions/QueryFailException";
import {AbstractConnection} from 'myorm_core';

export default class MySQLDBConnection extends AbstractConnection
{
    public HostName!: string;
    public Port!: number;
    public DataBaseName!: string;
    public UserName!: string;
    public PassWord!: string; 
    public IsOpen: boolean;
    private _conn! : mysql.Connection;
    private _database! : string;    

    constructor(host : string, port : number, dababase : string, user : string, pass : string)
    {        
        super();
        this.HostName = host;
        this.Port = port;
        this.DataBaseName = dababase;
        this._database = dababase;
        this.UserName = user;
        this.PassWord = pass;  
        this.IsOpen = false;      
    }     
    
    public AsMySQL() : MySQLDBConnection
    {        
        this.DataBaseName = "mysql";
        return this;
    }
    
    public OpenAsync() : Promise<void>
    {

        return new Promise<void>(async (resolve, reject) => 
        {
            if(this.IsOpen)
                await this.CloseAsync();

            this._conn = mysql.createConnection({
                host: this.HostName,
                user: this.UserName,
                password: this.PassWord,
                database: this._database
            });                        
    
            this.DataBaseName = this._database;

            try
            {
                await this._conn.connect();
                this.IsOpen = true;
                resolve();
    
            }catch(err)
            {
                
                reject(new ConnectionFailException((err as Error).message));
            }   
        });      

    }

    public QueryAsync(query : string) : Promise<any>
    {
        return new Promise<any>((resolve, reject) => 
        {
            try{
                this._conn.query(query, (err, result) => {

                    if(err)
                    {
                        reject(new QueryFailException((err as Error).message, query));
    
                    }else
                    {
                        resolve(result);
                    }
                });
            }catch(err)
            {
                reject(new ConnectionFailException((err as any).message));
            }
            
               
        });  
        
        
    }

    public CloseAsync()
    {
        return new Promise<void>(async (resolve, reject) => 
        {
            try
            {
                await this._conn.end();
                this.IsOpen = false;
                resolve();
                
            }catch(err)
            {
                reject(new ConnectionFailException((err as Error).message));
            }    
        });  
         
        
    }


    public async ExecuteNonQueryAsync(query: string): Promise<void> {
       
        return new Promise<void>((resolve, reject) => 
        {
            try{
                this._conn.query(query, (err, result) => {

                    if(err)
                    {
                        reject(new QueryFailException((err as Error).message, query));
    
                    }else
                    {
                        resolve();
                    }
                });
            }catch(err)
            {
                reject(new ConnectionFailException((err as any).message));
            }
        });          

    }


    public async ExecuteAsync(query: string): Promise<any> {

        return new Promise<any>((resolve, reject) => 
        {
            try{
                this._conn.query(query, (err, result) => {

                    if(err)
                    {
                        reject(new QueryFailException(err.message, query));

                    }else
                    {
                        resolve(result);
                    }
                });
            }catch(err)
            {
                reject(new ConnectionFailException((err as any).message));
            }
             
        });  
    }
}