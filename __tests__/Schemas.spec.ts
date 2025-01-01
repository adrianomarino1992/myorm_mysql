

import { TryAsync, CreateConnection } from "./functions/TestFunctions";
import Type from "../src/core/design/Type";
import PGConnection from "../src/implementations/MySQLConnection";
import MySQLManager from "../src/implementations/MySQLManager";
import Context from "./classes/TestContext";
import {Person} from './classes/TestEntity';



describe("Types and metadata", ()=>{
    

    test("Testing if a database exists", async ()=>{

        var conn = CreateConnection();

        var manager = new MySQLManager(conn);

        let postgres = await manager.CheckDatabaseAsync('postgres');
        let mysql = await manager.CheckDatabaseAsync('mysql');
       
        expect(postgres).toBeFalsy();
        expect(mysql).toBeTruthy();

    });


    test("Testing create a database", async ()=>{

        var conn = CreateConnection();

        var manager = new MySQLManager(conn);

        let test_db = await manager.CheckDatabaseAsync('test_db');

        if(test_db)
        {
            await conn.AsMySQL().OpenAsync();
            await conn.ExecuteNonQueryAsync(`drop database test_db;`);
            await conn.CloseAsync();
        }

        await manager.CreateDataBaseAsync('test_db');
       
        test_db = await manager.CheckDatabaseAsync('test_db');

        expect(test_db).toBeTruthy();        

    });


    describe("Schemas", ()=>{
       
    
        test("Testing create a table and checking if it was created", async ()=>{
    
            var conn = CreateConnection();
    
            var manager = new MySQLManager(conn);
    
            let test_table = await manager.CheckTableAsync(Person);
    
            if(test_table)
            {
                await conn.OpenAsync();
                await conn.ExecuteNonQueryAsync(`drop table person_tb;`);
                await conn.CloseAsync();
            }
            
            await manager.CreateTableAsync(Person);
           
            test_table = await manager.CheckTableAsync(Person);
    
            expect(test_table).toBeTruthy();        
    
        });


        describe("Testing columns", ()=>{


            test("Testing if a column exists", async ()=>{
    
                var conn = CreateConnection();

                var manager = new MySQLManager(conn);
        
                let table = await manager.CheckColumnAsync(Person, 'Name');
               
                expect(table).toBeFalsy();        
        
            });
        
        
            test("Testing create a column and checking if it was created", async ()=>{
        
                var conn = CreateConnection();
        
                var manager = new MySQLManager(conn);
        
                let test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                if(test_column)
                {
                    await conn.OpenAsync();
                    await conn.ExecuteNonQueryAsync(`alter table person_tb drop column name;`);
                    await conn.CloseAsync();
                }
                
                await manager.CreateColumnAsync(Person, 'Name');
               
                test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                expect(test_column).toBeTruthy();        
        
            });


            test("Testing create a column and drop it", async ()=>{
        
                var conn = CreateConnection();
        
                var manager = new MySQLManager(conn);
        
                let test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                if(test_column)
                {
                    await conn.OpenAsync();
                    await conn.ExecuteNonQueryAsync(`alter table person_tb drop column name;`);
                    await conn.CloseAsync();
                }
                
                await manager.CreateColumnAsync(Person, 'Name');
               
                test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                expect(test_column).toBeTruthy();     
                
                await manager.DropColumnAsync(Person, 'Name');

                test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                expect(test_column).toBeFalsy();     
        
            });
    
        });



        describe("Schemas within context", ()=>{


            test("Testing crete columns from a objetc", async ()=>{
    
                await TryAsync(async()=>{

                    var conn = CreateConnection();
        
                    var manager = new MySQLManager(conn);                   
            
                    var context = new Context(manager);  

                    for(let t of context.GetMappedTypes())
                    {
                        if(await manager.CheckTableAsync(t))
                        {
                            await conn.OpenAsync();
                            await conn.ExecuteNonQueryAsync(`drop table ${Type.GetTableName(t)};`);
                            await conn.CloseAsync();
                        }
                    } 

                     await context.UpdateDatabaseAsync();

                    for(let t of context.GetMappedTypes())
                    {
                        expect(await manager.CheckTableAsync(t)).toBeTruthy();

                        for(let c of Type.GetColumnNameAndType(t))
                        {
                            expect(await manager.CheckColumnAsync(t, c.Field)).toBeTruthy();
                        }                    
                    }
                }, err => 
                {
                    throw err;
                });
                
        
            }, 5000000);


            test("Testing check column type", async ()=>{
        
                var conn = CreateConnection();
        
                var manager = new MySQLManager(conn);
        
                let test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                if(test_column)
                {
                    await conn.OpenAsync();
                    await conn.ExecuteNonQueryAsync(`alter table person_tb drop column name;`);
                    await conn.CloseAsync();
                }
                
                await manager.CreateColumnAsync(Person, 'Name');
               
                test_column = await manager.CheckColumnAsync(Person, 'Name');
        
                expect(test_column).toBeTruthy();     
                
                let type = await manager.CheckColumnTypeAsync(Person, 'Name');               
        
                expect(type).toBe("text");     
        
            });


            test("Testing change column type", async ()=>{
        
                var conn = CreateConnection();
        
                var manager = new MySQLManager(conn);
        
                let test_column = await manager.CheckColumnAsync(Person, 'CEP');
        
                if(test_column)
                {
                    await conn.OpenAsync();
                    await conn.ExecuteNonQueryAsync(`alter table person_tb drop column cep;`);    
                    await conn.ExecuteNonQueryAsync(`alter table person_tb add column cep bigint;`);                
                    await conn.CloseAsync();
                }               
                
               
                test_column = await manager.CheckColumnAsync(Person, 'CEP');
        
                expect(test_column).toBeTruthy();     
                
                let type = await manager.CheckColumnTypeAsync(Person, 'CEP');               
        
                expect(type).toBe("bigint");  

                await manager.ChangeColumnTypeAsync(Person, "CEP");

                type = await manager.CheckColumnTypeAsync(Person, 'CEP');               
        
                expect(type).toBe("integer");                 
                
        
            });
        
    
        });

    });

});