import { PrimaryKey, Column, DataType, DBTypes } from "../../src/Index";


export abstract class Entity {
    @PrimaryKey()
    @DataType(DBTypes.AUTO_INCREMENT)
    public Id: number = -1;
}





