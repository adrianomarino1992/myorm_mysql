import mysql  from 'mysql';

import ConnectionFailException from "../core/exceptions/ConnectionFailException";
import QueryFailException from "../core/exceptions/QueryFailException";
import {AbstractConnection} from 'myorm_core';
import { InvalidOperationException, MySQLDBManager } from '../Index';

export default class MySQLDBConnection extends AbstractConnection
{
    protected static _pools : {[key: string] : mysql.Pool} = {}; 

    public HostName!: string;
    public Port!: number;
    public DataBaseName!: string;
    public UserName!: string;
    public PassWord!: string; 
    public InPoolMode! : boolean;    
    public MaxPool!: number;
    public IsOpen: boolean;
    private _conn! : mysql.Connection | mysql.PoolConnection;
    private _originalDatabase! : string; 
    private _originalUsePoolMode! : boolean; 
    private _inTransactionMode : boolean = false;
   

    constructor(host : string, port : number, dabatase : string, user : string, pass : string, usePool : boolean = true, max: number = 10)
    {        
        super();
        this.HostName = host;
        this.Port = port;
        this.DataBaseName = dabatase;
        this._originalDatabase = dabatase;
        this.UserName = user;
        this.PassWord = pass; 
        this._originalUsePoolMode = usePool;
        this.InPoolMode = usePool;       
        this.MaxPool = max; 
        this.IsOpen = false;      
    }     

    protected GetConnectionIdentifier()
    {
        return `${this.DataBaseName}${this.HostName}${this.Port}${this.UserName}`;
    }

    public static async CloseAllPoolsAsync()
    {
        for(let key in MySQLDBConnection._pools)
        {
            await MySQLDBConnection._pools[key].end();
        }
    }

    protected static async ClosePoolAsync(key: string)
    {
        if(!MySQLDBConnection._pools[key])
            return;

        await MySQLDBConnection._pools[key].end();
        
    }

    protected static StartPoolingIfNeeded(mysqlConnection: MySQLDBConnection)
    {
        if(!MySQLDBConnection._pools[mysqlConnection.GetConnectionIdentifier()])
        {
            MySQLDBConnection._pools[mysqlConnection.GetConnectionIdentifier()] = mysql.createPool({
                user: mysqlConnection.UserName,
                host: mysqlConnection.HostName,
                database : mysqlConnection.DataBaseName,
                port: mysqlConnection.Port,
                password: mysqlConnection.PassWord,
                connectionLimit: mysqlConnection.MaxPool
            });            
        }

       
    }

    public AsMySQL() : MySQLDBConnection
    {        
        this.DataBaseName = "mysql";
        this.InPoolMode = false;
        return this;
    }


    private async ExtractPoolConnectionFromPool() : Promise<mysql.PoolConnection>
    {
        return new Promise<mysql.PoolConnection>((resolve, reject) => {

            MySQLDBConnection._pools[this.GetConnectionIdentifier()]!.getConnection((err, conn) => {
                if(err)                
                    reject(err);
                else
                    resolve(conn);               

            });
        });
    }
    
    public OpenAsync() : Promise<void>
    {

        return new Promise<void>(async (resolve, reject) => 
        {
            

            try
            {
                if(this.IsOpen)
                    await this.CloseAsync();

                if(this.InPoolMode)
                {
                    MySQLDBConnection.StartPoolingIfNeeded(this);

                     this._conn = await this.ExtractPoolConnectionFromPool();

                }else{

                    this._conn = mysql.createConnection({
                    host: this.HostName,
                    user: this.UserName,
                    password: this.PassWord,
                    database: this.DataBaseName
                    });                        
        
                    await this._conn.connect();
                }

                
              
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
                if(!this.IsOpen || !this._conn)
                    return resolve();

                if(!this.InPoolMode)
                    await this._conn.end();
                else                
                    (this._conn as mysql.PoolConnection).release();
                
                this.DataBaseName = this._originalDatabase;
                this.InPoolMode = this._originalUsePoolMode;
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