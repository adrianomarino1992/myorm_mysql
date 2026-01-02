import mysql  from 'mysql';

import ConnectionFailException from "../core/exceptions/ConnectionFailException";
import QueryFailException from "../core/exceptions/QueryFailException";
import {AbstractConnection} from 'myorm_core';
import { InvalidOperationException } from '../Index';

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
    private _inTransactionMode : boolean = false;
   

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
            

            try
            {
                if(this.IsOpen)
                    await this.CloseAsync();

            this._conn = mysql.createConnection({
                host: this.HostName,
                user: this.UserName,
                password: this.PassWord,
                database: this.DataBaseName
            });                        
    
            this.DataBaseName = this._database;
                await this._conn.connect();
                this.IsOpen = true;
                resolve();
    
            }catch(err)
            {
                
                reject(new ConnectionFailException((err as Error).message));
            }   
        });      

    }

    
    public async BeginTransactionAsync() : Promise<void>
    {
        return new Promise<void>(async (resolve, reject) => 
        {
            try
            { 
                await this._conn.query("START TRANSACTION")
                this._inTransactionMode = true;
                resolve();
                
            }catch(err)
            {
                reject(new QueryFailException((err as Error).message, "START TRANSACTION"));
            }    
        });  
    }

    
     public async SavePointAsync(savepoint : string) : Promise<void>
    {       

        return new Promise<void>(async (resolve, reject) => 
        {
            try
            {
                 if(!savepoint || !savepoint.trim())
                   return reject( new InvalidOperationException("The name of savepoint is required"));        

                if(!this._inTransactionMode)
                    return reject(new InvalidOperationException(`Can not create a savepoint before start a transaction. Call the ${MySQLDBConnection.name}.${this.BeginTransactionAsync.name} method before`));

                await this._conn.query(`SAVEPOINT ${savepoint.toLowerCase()}`)

                resolve();
                
            }catch(err)
            {
                reject(new QueryFailException((err as Error).message, `SAVEPOINT ${savepoint.toLowerCase()}`));
            }    
        });  
    }


    public async CommitAsync() : Promise<void>
    {
        return new Promise<void>(async (resolve, reject) => 
        {
            try
            {         
                 if(!this._inTransactionMode)
                    return reject(new InvalidOperationException(`Can not do a commit before start a transaction. Call the ${MySQLDBConnection.name}.${this.BeginTransactionAsync.name} method before`));
                
                await this._conn.query("COMMIT")
                this._inTransactionMode = false;

                resolve();
                
            }catch(err)
            {
                reject(new QueryFailException((err as Error).message, "COMMIT"));
            }    
        });  
    }

    public async RollBackAsync(toSavePoint?: string) : Promise<void>
    {
        return new Promise<void>(async (resolve, reject) => 
        {
            try
            {
                if(!this._inTransactionMode)
                   return reject( new InvalidOperationException(`Can not do a rollback before start a transaction. Call the ${MySQLDBConnection.name}.${this.BeginTransactionAsync.name} method before`));

                let query = toSavePoint && toSavePoint.trim() ? `ROLLBACK TO SAVEPOINT ${toSavePoint}` : "ROLLBACK";
                await this._conn.query(query)
                resolve();

                if(!toSavePoint || !toSavePoint.trim())
                    this._inTransactionMode = false;
                
            }catch(err)
            {
                reject(new QueryFailException((err as Error).message, (toSavePoint && toSavePoint.trim() ? `ROLLBACK TO SAVEPOINT ${toSavePoint}` : "ROLLBACK")));
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
                if(!this.IsOpen)
                    return resolve();

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