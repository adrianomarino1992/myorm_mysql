import { IFluentField, AbstractFluentField, Operation } from "myorm_core";

import MySQLDBSet from "./MySQLDBSet";


export default class MySQLFluentField<T extends object, K extends keyof T, P extends MySQLDBSet<T>> extends AbstractFluentField<T, K, P>
{
    private _mysqlSet : P;
    private _field : keyof T;
    private _isOr : boolean;


    constructor(mysqlSet : P, field : keyof T, isOr : boolean = false)
    {
        super();
        this._mysqlSet = mysqlSet;
        this._field = field;
        this._isOr = isOr;
    }

    public IsGreaterThan(value: T[K]): P {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,
                Kind : Operation.GREATHER, 
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field,
            Kind : Operation.GREATHER, 
            Value : value 
        });

        return this._mysqlSet;
    }


    public IsEqualTo(value: T[K]): P  {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,               
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field,            
            Value : value
        });

        return this._mysqlSet;
    }


    public IsNotEqualTo(value: T[K]): P {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,
                Kind : Operation.NOTEQUALS, 
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field, 
            Kind : Operation.NOTEQUALS,           
            Value : value 
        });

        return this._mysqlSet;
    }


    public IsSmallerThan(value: T[K]): P  {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,
                Kind : Operation.SMALLER, 
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field,
            Kind : Operation.SMALLER, 
            Value : value 
        });

        return this._mysqlSet;
    }


    public IsInsideIn(value: T[K][]): P  {

       for(let i = 0; i < value.length; i++)
       {
            if(i == 0 && !this._isOr)
            {
                this._mysqlSet.Where({
                    Field : this._field,                 
                    Value : value[i]
                });
            }
            else 
            {
                this._mysqlSet.Or({
                    Field : this._field,                 
                    Value : value[i]
                });
            }            
        }

        return this._mysqlSet;
    }


    public Contains(value: T[K]): P  {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,
                Kind : Operation.CONTAINS, 
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field,  
            Kind : Operation.CONTAINS,               
            Value : value
        });     

        return this._mysqlSet;
    }


    public StartsWith(value: T[K]): P  {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,
                Kind : Operation.STARTWITH, 
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field,  
            Kind : Operation.STARTWITH,               
            Value : value
        });     

        return this._mysqlSet;
    }


    public EndsWith(value: T[K]): P  {

        if(this._isOr)
        {
            this._mysqlSet.Or({
                Field : this._field,
                Kind : Operation.ENDWITH, 
                Value : value 
            });
    
            return this._mysqlSet;
        }

        this._mysqlSet.Where({
            Field : this._field,  
            Kind : Operation.ENDWITH,               
            Value : value
        });     

        return this._mysqlSet;
    }

    public IsNull(): P  {

        if(!this._isOr)
        {
            this._mysqlSet.Where({
                Field : this._field,                 
                Value : undefined as unknown as T[keyof T]
            });
        }
        else 
        {
            this._mysqlSet.Or({
                Field : this._field,                 
                Value : undefined as unknown as T[keyof T]
            });
        }        
 
         return this._mysqlSet;
     }
    
}