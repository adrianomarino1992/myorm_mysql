export default class StringUtils
{
    public static IsNullOrEmpty(value : string | null | undefined) : boolean
    {
        return value == null || value == "";
    }

    public static IsNullOrWhiteSpace(value : string | null | undefined) : boolean
    {
        return value == null || value.trim() == "";
    }

    public static ReplaceAll(value : string, search : string, replace : string) : string    
    {
        if(!value)
            return value;
        
        return value.split(search).join(replace);
    }
}