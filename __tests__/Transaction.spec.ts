import 'reflect-metadata';
import { Person } from './classes/TestEntity';
import { Operation } from 'myorm_core';
import {TruncatePersonTableAsync, CreateContext, SeedAsync, CompleteSeedAsync, TruncateTablesAsync} from './functions/TestFunctions';
import TypeNotMappedException from '../src/core/exceptions/TypeNotMappedException';
import { Message } from './classes/RelationEntity';
import { describe, test, expect, afterAll, beforeAll } from '@jest/globals';
import MySQLDBConnection from "../src/implementations/MySQLDBConnection";

afterAll(async () =>
{
    await MySQLDBConnection.CloseAllPoolsAsync();
});




describe("Transactions", () => {

    test("Should not allow manual transaction when auto commit is off", async () => {

         const context = CreateContext();
         context["_manager"]["_autoCommit"] = false;

         await expect(context.BeginTransactionAsync()).rejects.toThrow("auto-commit mode is disabled");
    }, 100000);

    test("Should keep manual transaction open after query error in auto commit mode", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();

         await context.BeginTransactionAsync();
         await context.Persons.AddAsync(new Person("Before error", "before-error@test.com"));

         await expect(context.ExecuteNonQuery("select * from table_that_does_not_exist;")).rejects.toBeDefined();

         await context.RollBackAsync();

         const persons = await context.Persons.ToListAsync();

         expect(persons.length).toBe(0);

    }, 100000);

    test("Should recover manual transaction using savepoint after query error in auto commit mode", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();

         await context.BeginTransactionAsync();
         await context.Persons.AddAsync(new Person("Before savepoint", "before-savepoint@test.com"));
         await context.SavePointAsync("before_failure");

         await expect(context.ExecuteNonQuery("select * from table_that_does_not_exist;")).rejects.toBeDefined();

         await context.RollBackAsync("before_failure");
         await context.Persons.AddAsync(new Person("After rollback", "after-rollback@test.com"));
         await context.CommitAsync();

         const persons = await context.Persons.ToListAsync();

         expect(persons.length).toBe(2);
         expect(persons.some(p => p.Email == "before-savepoint@test.com")).toBeTruthy();
         expect(persons.some(p => p.Email == "after-rollback@test.com")).toBeTruthy();

    }, 100000);

    test("Should recover context after transaction error in auto commit off mode", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();
         context["_manager"]["_autoCommit"] = false;

         await context.Persons.AddAsync(new Person("Before error", "before-error@test.com"));

         await expect(context.ExecuteNonQuery("select * from table_that_does_not_exist;")).rejects.toBeDefined();

         await context.Persons.AddAsync(new Person("After error", "after-error@test.com"));
         await context.SaveChangesAsync();

         const persons = await context.Persons.ToListAsync();

         expect(persons.length).toBe(1);
         expect(persons[0].Email).toBe("after-error@test.com");

    }, 100000);

    test("Should discard implicit transaction after query error in auto commit off mode", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();
         context["_manager"]["_autoCommit"] = false;

         await context.Persons.AddAsync(new Person("Before error", "before-error@test.com"));

         await expect(context.ExecuteNonQuery("select * from table_that_does_not_exist;")).rejects.toBeDefined();

         await context.DiscartChangesAsync();

         const persons = await context.Persons.ToListAsync();

         expect(persons.length).toBe(0);

    }, 100000);

    test("Should save all entities", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();

         const person1 = new Person("Adriano", "adriano@test.com");
         const person2 = new Person("Camila", "camila@test.com");
         const person3 = new Person("Juliana", "juliana@test.com");
         const person4 = new Person("Andre", "andre@test.com");
        
         const msg = new Message("some message", person1, [person2, person3, person4]);


         await context.BeginTransactionAsync();

         await context.Persons.AddAsync(person1);
         await context.Persons.AddAsync(person2);
         await context.Persons.AddAsync(person3);
         await context.Persons.AddAsync(person4);
         await context.Messages.AddAsync(msg);

         await context.CommitAsync();


        let personsCount = await context.Persons.CountAsync();
        let mgsCount = await context.Messages.CountAsync();


        expect(personsCount).toBe(4);
        expect(mgsCount).toBe(1);

    }, 100000 );


    test("Should save all persons only", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();

         const person1 = new Person("Adriano", "adriano@test.com");
         const person2 = new Person("Camila", "camila@test.com");
         const person3 = new Person("Juliana", "juliana@test.com");
         const person4 = new Person("Andre", "andre@test.com");
        
         const msg = new Message("some message", person1, [person2, person3, person4]);


         await context.BeginTransactionAsync();

         await context.Persons.AddAsync(person1);
         await context.Persons.AddAsync(person2);
         await context.Persons.AddAsync(person3);
         await context.Persons.AddAsync(person4);

         await context.SavePointAsync("persons");

         await context.Messages.AddAsync(msg);

         await context.RollBackAsync("persons");

         await context.CommitAsync();


        let personsCount = await context.Persons.CountAsync();
        let mgsCount = await context.Messages.CountAsync();


        expect(personsCount).toBe(4);
        expect(mgsCount).toBe(0);

    }, 100000 );
    

    test("Should rollback all transaction", async () => {

         await TruncateTablesAsync();
         const context = CreateContext();

         const person1 = new Person("Adriano", "adriano@test.com");
         const person2 = new Person("Camila", "camila@test.com");
         const person3 = new Person("Juliana", "juliana@test.com");
         const person4 = new Person("Andre", "andre@test.com");
        
         const msg = new Message("some message", person1, [person2, person3, person4]);


         await context.BeginTransactionAsync();

         await context.Persons.AddAsync(person1);
         await context.Persons.AddAsync(person2);
         await context.Persons.AddAsync(person3);
         await context.Persons.AddAsync(person4);

         await context.SavePointAsync("persons");

         await context.Messages.AddAsync(msg);

         await context.RollBackAsync("persons");

         await context.RollBackAsync();


        let personsCount = await context.Persons.CountAsync();
        let mgsCount = await context.Messages.CountAsync();


        expect(personsCount).toBe(0);
        expect(mgsCount).toBe(0);

    }, 100000 );


});


