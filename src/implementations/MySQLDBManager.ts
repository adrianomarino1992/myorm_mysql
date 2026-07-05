import {AbstractManager} from 'myorm_core';
import TypeNotSuportedException from '../core/exceptions/TypeNotSuportedException';
import Type from '../core/design/Type';
import MySQLDBConnection from './MySQLDBConnection';
import SchemasDecorators from '../core/decorators/SchemasDecorators';
import InvalidOperationException from '../core/exceptions/InvalidOperationException';
import { ConstraintFailException ,DBTypes } from '../Index';
import { RelationType } from '../core/enums/RelationType';
import {DBOperationLogHandler, LogType} from 'myorm_core'; 


export default class MySQLDBManager extends AbstractManager
{
    
    private _connection! : MySQLDBConnection;   
    private _logger? : DBOperationLogHandler;
    private _inTransactionMode : boolean = false;
    private _autoCommit: boolean = true;

    public get AutoCommit(): boolean
    {
        return this._autoCommit;
    }

    public get InTransactionMode(): boolean
    {
        return this._inTransactionMode;
    }

    public constructor(connection : MySQLDBConnection)
    {
        super();
        this._connection = connection;
    }

     public static Build(host: string, port: number, database: string,user: string, pass: string, usePool: boolean = true, max: number = 10,  autocommit: boolean = true) : MySQLDBManager
    {
        if(!host?.trim())
            throw new InvalidOperationException("Host cannot be null or empty.");

        if(port <= 0)
            throw new InvalidOperationException("Port must be greater than zero.");

        if(!database?.trim())
            throw new InvalidOperationException("Database cannot be null or empty.");

        if(!user?.trim())
            throw new InvalidOperationException("User cannot be null or empty.");

        if(!pass?.trim())
            throw new InvalidOperationException("Password cannot be null or empty.");       

        if(max <= 0)
            throw new InvalidOperationException("Maximum pool size must be greater than zero.");        

        const manager = new MySQLDBManager(new MySQLDBConnection(host, port, database, user, pass, usePool, max));

        manager._autoCommit = autocommit;

        return manager;
    }

    public static BuildFromEnviroment(): MySQLDBManager
    {
        const host = process.env.DB_HOST ?? "";
        const port = process.env.DB_PORT ?? "";
        const user = process.env.DB_USER ?? "";
        const pass = process.env.DB_PASS ?? "";
        const database = process.env.DB_NAME ?? "";

        const intPort = Number.parseInt(port, 10);

        if(Number.isNaN(intPort))
            throw new InvalidOperationException(
                "DB_PORT environment variable is not a valid integer."
            );

        let useAutoCommit: boolean | undefined = true;
        let usePool: boolean | undefined = true;   
        let maxPool: number | undefined;

        if(process.env.DB_USE_POOL)
        {
            const value = process.env.DB_USE_POOL.trim().toLowerCase();

            if(value != "true" && value != "false")
                throw new InvalidOperationException(
                    "DB_USE_POOL environment variable must be 'true' or 'false'."
                );

            usePool = value == "true";
        }

        if (process.env.DB_AUTO_COMMIT)
        {
            const value = process.env.DB_AUTO_COMMIT.trim().toLowerCase();

            if (value != "true" && value != "false")
                throw new InvalidOperationException(
                    "DB_AUTO_COMMIT environment variable must be 'true' or 'false'."
                );

            useAutoCommit = value == "true";
        }

        if(process.env.DB_MAX_POOL_SIZE)
        {
            maxPool = Number.parseInt(process.env.DB_MAX_POOL_SIZE, 10);

            if(Number.isNaN(maxPool))
                throw new InvalidOperationException(
                    "DB_MAX_POOL_SIZE environment variable is not a valid integer."
                );
        }

        return MySQLDBManager.Build(host, intPort, database, user, pass, usePool, maxPool, useAutoCommit);
    }
    
    public static async CloseAllPoolAsync() : Promise<void>
    {
        await MySQLDBConnection.CloseAllPoolsAsync();
    }
        

    public async CheckConnectionAsync(): Promise<boolean> {
        
        this.Log("Checking connection", LogType.CHECKCONNECTION);

        try
        {
            await this.OpenConnectionIfNeedAsync();
            return true;

        }
        catch
        { 
            return false;
        }
        finally
        {
            await this.CloseConnectionIfNeedAsync();
        }
    }
    
    public CheckDatabaseAsync(dababase: string): Promise<boolean> {
       
        return this.CreatePromisse<boolean>(async ()=>
        {
            this.Log(`Checking database ${dababase}`, LogType.CHECKDATABASE);

            await this._connection.AsMySQL().OpenAsync();

            let result = await this._connection.ExecuteAsync(`select * from information_schema.schemata where schema_name = '${dababase}'`);

            return result && result.length > 0;
        });
    }
    public CreateDataBaseAsync(dababase: string): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            this.Log(`Creating database ${dababase}`, LogType.CREATEDATABASE);

            await this._connection.AsMySQL().OpenAsync();

            await this._connection.ExecuteAsync(`create database ${dababase};`);            
        });
    }
    public CheckTableAsync(cTor : Function): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {           

            let table = Type.GetTableName(cTor);

            this.Log(`Checking table ${table}`, LogType.CHECKTABLE);

            await this.OpenConnectionIfNeedAsync();

            let result = await this._connection.ExecuteAsync(`select * from information_schema.tables where table_schema = '${this._connection.DataBaseName}' and table_name = '${table}';`);

           return result && result.length > 0;
        });
    }
    public CreateTableAsync(cTor : Function): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            this.Log(`Creating table ${table}`, LogType.CREATETABLE);

            await this.OpenConnectionIfNeedAsync();

            await this._connection.ExecuteAsync(`create table if not exists ${table}(_temp boolean);`);
            
        });
    }
    public CheckColumnAsync(cTor : Function, key : string): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Checking column ${table}.${column}`, LogType.CHECKCOLUMN);

            await this.OpenConnectionIfNeedAsync();

            let result = await this._connection.ExecuteAsync(`select * from information_schema.columns where table_name = '${table}' and column_name = '${column}';`);

            return result && result.length > 0;
        });
    }


    public DropTableAsync(cTor: Function): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            this.Log(`Dropping table ${table}`, LogType.CREATETABLE);

            await this.OpenConnectionIfNeedAsync();

            await this._connection.ExecuteAsync(`drop table if exists ${table};`);
            
        });
    }
    public CheckColumnTypeAsync(cTor: Function, key: string): Promise<string> {

        return this.CreatePromisse<string>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Checking column ${table}.${column} type`, LogType.CHECKCOLUMNTYPE);

            await this.OpenConnectionIfNeedAsync();

            let result = await this._connection.ExecuteAsync(`select data_type from information_schema.columns where table_name = '${table}' and column_name = '${column}';`);

            if(!result || result.length == 0)
                return "";

            return this.CastToMySQLType(result[0]['data_type']);
        });
        
    }
    public ChangeColumnTypeAsync(cTor: Function, key: string): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Creating column ${table}.${column}`, LogType.CHECKCOLUMN);

            let type = this.GetTypeOfColumn(cTor, key);
            
            await this.OpenConnectionIfNeedAsync();

            await this._connection.ExecuteAsync(`alter table ${table} modify ${column} ${type};`);            
            
        });
    }


    public DropColumnAsync(cTor: Function, key: string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Dropping table ${table}`, LogType.CREATETABLE);

            await this.OpenConnectionIfNeedAsync();

            await this._connection.ExecuteAsync(`alter table ${table} drop column ${column};`);
            
        });
    }
    
    public CreateColumnAsync(cTor : Function, key : string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Creating column ${table}.${column}`, LogType.CHECKCOLUMN);

            let type = this.GetTypeOfColumn(cTor, key);
            
            await this.OpenConnectionIfNeedAsync();

            let unique = type == DBTypes.AUTO_INCREMENT ? "unique" : "";  

            await this._connection.ExecuteAsync(`alter table ${table} add column \`${column}\` ${type} ${unique};`);

            if(SchemasDecorators.IsPrimaryKey(cTor, key))
            {
                await this._connection.ExecuteAsync(`alter table ${table} add primary key (\`${column}\`);`);
            }
            
        });
    }

    private GetTypeOfColumn(cTor : Function, key : string) : string
    {
        let type = "";

        try{

            type = this.CastToMySQLType(Type.GetDesingTimeTypeName(cTor, key)!);

        }catch(ex)
        {               
            
            let subType = Type.GetDesingType(cTor, key);

            let relation = SchemasDecorators.GetRelationAttribute(cTor, key);

            if(subType == undefined || subType == Array){
                
                if(relation)
                    subType = relation.TypeBuilder();
                
                if(relation == undefined)
                {
                    throw new InvalidOperationException(`Can not determine the relation of porperty ${cTor.name}.${key}`);
                }
            }                

            let relatedKey = SchemasDecorators.ExtractPrimaryKey(subType!);

            if(!relatedKey)
                throw new InvalidOperationException(`Can not determine the primary key of ${subType!.name}`); 

            if(relation?.Relation == RelationType.ONE_TO_MANY || relation?.Relation == RelationType.MANY_TO_MANY)
            {
                type = this.CastToMySQLType(Type.AsArray(Type.GetDesingTimeTypeName(subType!, relatedKey)!));

            }else{

                type = this.CastToMySQLType(Type.GetDesingTimeTypeName(subType!, relatedKey)!);

                if(type == DBTypes.AUTO_INCREMENT)
                    type = DBTypes.LONG;
            }  
        }

        return type;
        
    }

   
    public UpdateDatabaseForEntityAsync(cTor: Function): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            
            this.Log(`Checking entity ${cTor.name}`, LogType.CHECKENTITY);

            let table_name = Type.GetTableName(cTor);            
            
            if(table_name == undefined)
                throw new TypeNotSuportedException(`The type ${cTor.name} is not supported. Can not determine the table name of type`);

            let columns = Type.GetProperties(cTor);

            let hasPrimaryKey = false;

            for(let col of columns)
            {
                hasPrimaryKey = SchemasDecorators.IsPrimaryKey(cTor, col);
                if(hasPrimaryKey)
                    break;
            }

            if(!hasPrimaryKey)
                throw new ConstraintFailException(`The type ${cTor.name} has not a primary key column`);

        
            await this.OpenConnectionIfNeedAsync();

            if(!await this.CheckTableAsync(cTor))
                await this.CreateTableAsync(cTor);

            
            for(let column of columns)
            {
                if(!await this.CheckColumnAsync(cTor, column))
                {
                    await this.CreateColumnAsync(cTor, column);
                }else
                {
                    let type = this.GetTypeOfColumn(cTor, column);

                    if(type == DBTypes.AUTO_INCREMENT)
                        type = DBTypes.INTEGER;

                    let dbType = await this.CheckColumnTypeAsync(cTor, column);

                    if(type.trim().toLowerCase() != dbType.trim().toLowerCase())
                    {
                        await this.ChangeColumnTypeAsync(cTor, column);
                    }                    
                }
            }              
        });

    }

    
    public async BeginTransactionAsync() : Promise<void>
    {
        await this.OpenConnectionIfNeedAsync();
        await this._connection.BeginTransactionAsync();
        this._inTransactionMode = true;
    }

    public async SavePointAsync(savepoint : string) : Promise<void>
    {
        if(!savepoint || !savepoint.trim())
            throw new InvalidOperationException("The name of savepoint is required");

        if(!this._inTransactionMode)
            throw new InvalidOperationException(`Can not create a savepoint before start a transaction. Call the ${MySQLDBManager.name}.${this.BeginTransactionAsync.name} method before`);

        await this._connection.SavePointAsync(savepoint);
    }


    public async CommitAsync() : Promise<any>
    {           
        if(!this._inTransactionMode)
            throw new InvalidOperationException(`Can not do a commit before start a transaction. Call the ${MySQLDBManager.name}.${this.BeginTransactionAsync.name} method before`);

        await this._connection.CommitAsync();
        this._inTransactionMode = false;
    }

    public async RollBackAsync(toSavePoint?: string) : Promise<any>
    {
        if(!this._inTransactionMode)
            throw new InvalidOperationException(`Can not do a rollback before start a transaction. Call the ${MySQLDBManager.name}.${this.BeginTransactionAsync.name} method before`);

        await this._connection.RollBackAsync(toSavePoint);
        
        if(!toSavePoint)
            this._inTransactionMode = false;
    } 

    private async OpenConnectionIfNeedAsync() : Promise<void>
    {
        if(this._inTransactionMode && this._connection && this._connection.IsOpen)
            return;

        await this._connection.OpenAsync();
    }

    private async CloseConnectionIfNeedAsync() : Promise<void>
    {
        if(this._inTransactionMode && this._connection && this._connection.IsOpen)
            return;

        await this._connection.CloseAsync();
    }

    public async ExecuteNonQueryAsync(query: string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {   
            await this.OpenConnectionIfNeedAsync();

            this.Log(query, LogType.QUERY);
            
            await this._connection.ExecuteAsync(query);
            
        });
    }

    public async ExecuteAsync(query: string): Promise<any> {

        return this.CreatePromisse<void>(async ()=>
        {           
            await this.OpenConnectionIfNeedAsync();

            this.Log(query, LogType.QUERY);

            return await this._connection.ExecuteAsync(query);           
            
        });
    }

   
    
    private CreatePromisse<T>(func : ()=> Promise<T>) : Promise<T>
    {
        return new Promise<T>(async (resolve, reject)=>{

            let success = true;
            let result : any;
            try
            {                
                result = await func();
            }
            catch(err)
            {
                success = false;
                result = err;
            }
            finally
            {
                await this.CloseConnectionIfNeedAsync();
                
                if(success)
                    resolve(result);
                else
                    reject(result);
            }
        });
    }

    
    private CastToMySQLType(type : string) : string
    {
        switch(type.toLowerCase())
        {
            case "integer" : return "integer";
            case "int" : return "integer";
            case "number" : return "bigint";
            case "long" : return "bigint";
            case "bigint" : return "bigint";
            case "double" : return "float";
            case "text" : return "text";
            case "string" : return "text";
            case "date" : return "date";
            case "datetime" : return "timestamp";
            case "boolean" : return "boolean";           
            case "bigint auto_increment" : return "bigint auto_increment";
            case "json" : return "JSON";   
            case "array" : return "JSON";        
            case "integer[]" : return "JSON";
            case "number[]" : return "JSON";
            case "long[]" : return "JSON";
            case "text[]" : return "JSON";
            case "string[]" : return "JSON";
            case "date[]" : return "JSON";
            case "datetime[]" : return "JSON";
            case "boolean[]" : return "JSON";  
            case "double[]" : return "JSON";          
            default: throw new TypeNotSuportedException(`The type ${type} is not suported`);
        }
    }
     
    public SetLogger(logger : DBOperationLogHandler) : void { this._logger = logger;}

    private Log(message : string, type : LogType)
    {
        if(this._logger)
            try{this._logger(message, type);}catch{}
    }

}