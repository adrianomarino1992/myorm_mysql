import 'reflect-metadata';
import { Person } from "./classes/TestEntity";
import Type from '../src/core/design/Type';
import RawTypes from "./classes/RawTypes";
import { describe, test, expect, afterAll, beforeAll } from '@jest/globals';
import MySQLDBConnection from "../src/implementations/MySQLDBConnection";

afterAll(async () =>
{
    await MySQLDBConnection.CloseAllPoolsAsync();
});

describe("Tpe utils functions", ()=>{


    test("should get table name from types", ()=>{
        
        
        let person_tb = Type.GetTableName(Person);
        let rawTypes = Type.GetTableName(RawTypes);

        expect(person_tb).toBe("person_tb");
        expect(rawTypes).toBe("rawtypes");
        
    });


});