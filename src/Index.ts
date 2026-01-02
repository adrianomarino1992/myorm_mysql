import { DBTypes } from "./core/enums/DBTypes";
import SchemasDecorators from "./core/decorators/SchemasDecorators";
import MySQLDBConnection from "./implementations/MySQLDBConnection";
import MySQLDBContext from "./implementations/MySQLDBContext";
import MySQLDBManager from "./implementations/MySQLDBManager";
import MySQLDBSet from "./implementations/MySQLDBSet";

import QueryFailException from "./core/exceptions/QueryFailException";
import NotImpletedException from "./core/exceptions/NotImplementedException";
import TypeNotMappedException from "./core/exceptions/TypeNotMappedException";
import ConnectionFailException from "./core/exceptions/ConnectionFailException";
import ConstraintFailException from "./core/exceptions/ConstraintFailException";    
import TypeNotSuportedException from "./core/exceptions/TypeNotSuportedException";
import InvalidOperationException from "./core/exceptions/InvalidOperationException";

import { DBOperationLogHandler, LogType } from "myorm_core";
import { Operation } from "myorm_core";

export {DBOperationLogHandler}
export {LogType}
export {Operation}

export {ConnectionFailException}
export {ConstraintFailException}
export {InvalidOperationException}
export {NotImpletedException}
export {QueryFailException}
export {TypeNotMappedException}
export {TypeNotSuportedException};


export {DBTypes};
export {MySQLDBConnection}
export {MySQLDBContext}
export {MySQLDBManager}
export {MySQLDBSet}

export function Column(name? : string)
{
    return SchemasDecorators.Column(name);
}

export function Table(name? : string)
{
    return SchemasDecorators.Table(name);
}

export function DataType(dbType : DBTypes)
{
    return SchemasDecorators.DataType(dbType);
}

export function PrimaryKey()
{
    return SchemasDecorators.PrimaryKey();
}

export function OneToMany<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.OneToMany(typeBuilder, property);
}

export function OneToOne<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.OneToOne(typeBuilder, property);
}

export function ManyToMany<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.ManyToMany(typeBuilder, property);
}

export function ManyToOne<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.ManyToOne(typeBuilder, property);
}



