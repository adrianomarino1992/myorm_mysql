import {AbstractManager} from 'myorm_core';


import 'reflect-metadata';
import TypeNotSuportedException from '../core/exceptions/TypeNotSuportedException';
import Type from '../core/design/Type';
import MySQLDBConnection from './MySQLConnection';
import SchemasDecorators from '../core/decorators/SchemasDecorators';
import InvalidOperationException from '../core/exceptions/InvalidOperationException';
import { DBTypes } from '../Index';
import { RelationType } from '../core/enums/RelationType';
import {DBOperationLogHandler, LogType} from 'myorm_core'; 


export default class MySQLManager extends AbstractManager
{
    
    private _connection! : MySQLDBConnection;   
    private _logger? : DBOperationLogHandler;

    public constructor(connection : MySQLDBConnection)
    {
        super();
        this._connection = connection;
    }

    public async CheckConnectionAsync(): Promise<boolean> {
        
        this.Log("Checking connection", LogType.CHECKCONNECTION);

        try
        {
            await this._connection.OpenAsync();
            return true;

        }
        catch
        { 
            return false;
        }
        finally
        {
            await this._connection.CloseAsync();
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

            await this._connection.OpenAsync();

            let result = await this._connection.ExecuteAsync(`select * from information_schema.tables where table_schema = '${this._connection.DataBaseName}' and table_name = '${table}';`);

            return result && result.length > 0;
        });
    }
    public CreateTableAsync(cTor : Function): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            this.Log(`Creating table ${table}`, LogType.CREATETABLE);

            await this._connection.OpenAsync();

            await this._connection.ExecuteAsync(`create table if not exists ${table}(_temp boolean);`);
            
        });
    }
    public CheckColumnAsync(cTor : Function, key : string): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Checking column ${table}.${column}`, LogType.CHECKCOLUMN);

            await this._connection.OpenAsync();

            let result = await this._connection.ExecuteAsync(`select * from information_schema.columns where table_name = '${table}' and column_name = '${column}';`);

            return result && result.length > 0;
        });
    }


    public DropTableAsync(cTor: Function): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            this.Log(`Dropping table ${table}`, LogType.CREATETABLE);

            await this._connection.OpenAsync();

            await this._connection.ExecuteAsync(`drop table if exists ${table};`);
            
        });
    }
    public CheckColumnTypeAsync(cTor: Function, key: string): Promise<string> {

        return this.CreatePromisse<string>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Checking column ${table}.${column} type`, LogType.CHECKCOLUMNTYPE);

            await this._connection.OpenAsync();

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
            
            await this._connection.OpenAsync();

            await this._connection.ExecuteAsync(`alter table ${table} modify ${column} ${type};`);            
            
        });
    }


    public DropColumnAsync(cTor: Function, key: string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Dropping table ${table}`, LogType.CREATETABLE);

            await this._connection.OpenAsync();

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
            
            await this._connection.OpenAsync();

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

            await this._connection.OpenAsync();

            if(!await this.CheckTableAsync(cTor))
                await this.CreateTableAsync(cTor);

            let columns = Type.GetProperties(cTor);
            
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

    public async ExecuteNonQueryAsync(query: string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {   
            await this._connection.OpenAsync();

            this.Log(query, LogType.QUERY);
            
            await this._connection.ExecuteAsync(query);
            
        });
    }

    public async ExecuteAsync(query: string): Promise<any> {

        return this.CreatePromisse<void>(async ()=>
        {           
            await this._connection.OpenAsync();

            this.Log(query, LogType.QUERY);

            return await this._connection.ExecuteAsync(query);           
            
        });
    }

    public static Build(host : string, port : number, dababase : string, user : string, pass : string) : MySQLManager
    {
        return new MySQLManager(new MySQLDBConnection(host, port, dababase, user, pass));
    }

    public static BuildFromEnviroment()
    {
        let host = process.env.DB_HOST || "";
        let port = process.env.DB_PORT || "0";
        let username = process.env.DB_USER || "";
        let password = process.env.DB_PASS || "";
        let database = process.env.DB_NAME || "";
        let intPort = 0;
        try{
            intPort = Number.parseInt(port);
        }catch{}
        
        if(!host)
            throw new InvalidOperationException(`DB_HOST enviroment variable was no value`);

        if(!port || Number.isNaN(intPort))
            throw new InvalidOperationException(`DB_PORT enviroment variable was no value`);

        if(!username)
            throw new InvalidOperationException(`DB_USER enviroment variable was no value`);

        if(!password)
            throw new InvalidOperationException(`DB_PASS enviroment variable was no value`);
            
        if(!database)
            throw new InvalidOperationException(`DB_NAME enviroment variable was no value`);

        return MySQLManager.Build(host, intPort, database, username, password)
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
                if(this._connection.IsOpen)
                    await this._connection.CloseAsync();
                
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