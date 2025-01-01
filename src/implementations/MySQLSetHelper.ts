import MySQLDBSet from "./MySQLDBSet";

export default class MySQLSetHelper
{

    private static _sqlKey = "__orm__sql__";
    private static _joinKey = "__orm__join__";
    private static _onKey = "__orm__on__";
    private static _whereKey = "__orm__where__";

    public static InjectORMData<T extends Object>(set : MySQLDBSet<T>, key : string, value : string) : MySQLDBSet<T>
    {
        (set as any)[key] = value;
        return set;
    }

    public static ExtractORMData<T extends Object>(set : MySQLDBSet<T>, key : string) : string
    {
        return (set as any)[key] ?? "";         
    }

    public static InjectSQL<T extends Object>(set : MySQLDBSet<T>, sql : string) : MySQLDBSet<T>
    {        
        return MySQLSetHelper.InjectORMData<T>(set, MySQLSetHelper._sqlKey, sql);
    }

    public static InjectWhere<T extends Object>(set : MySQLDBSet<T>, where : string) : MySQLDBSet<T>
    {        
        return MySQLSetHelper.InjectORMData<T>(set, MySQLSetHelper._whereKey, where);
    }

    public static InjectJoin<T extends Object>(set : MySQLDBSet<T>, join : string) : MySQLDBSet<T>
    {
        return MySQLSetHelper.InjectORMData<T>(set, MySQLSetHelper._joinKey, join);
    }

    public static InjectOn<T extends Object>(set : MySQLDBSet<T>, on : string) : MySQLDBSet<T>
    {
        return MySQLSetHelper.InjectORMData<T>(set, MySQLSetHelper._onKey, on);
    }

    public static ExtractJoinData<T extends Object>(set : MySQLDBSet<T>) : string
    {
        return MySQLSetHelper.ExtractORMData(set, MySQLSetHelper._joinKey);       
    }

    public static ExtractOnData<T extends Object>(set : MySQLDBSet<T>) : string
    {
        return MySQLSetHelper.ExtractORMData(set, MySQLSetHelper._onKey);       
    }

    public static ExtractWhereData<T extends Object>(set : MySQLDBSet<T>) : string
    {
        return MySQLSetHelper.ExtractORMData(set, MySQLSetHelper._whereKey);       
    }

    public static ExtractSQLData<T extends Object>(set : MySQLDBSet<T>) : string
    {
        return MySQLSetHelper.ExtractORMData(set, MySQLSetHelper._sqlKey);       
    }
    
    public static CleanORMData<T extends Object>(set : MySQLDBSet<T>) : void
    {
        MySQLSetHelper.InjectJoin(set, "");
        MySQLSetHelper.InjectSQL(set, "");
        MySQLSetHelper.InjectOn(set, "");
        MySQLSetHelper.InjectSQL(set, "");
    }

}