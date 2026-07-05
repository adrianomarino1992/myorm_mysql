import 'reflect-metadata';
import { Operation } from 'myorm_core';
import { CompleteSeedAsync, CreateContext, TruncatePersonTableAsync } from './functions/TestFunctions';
import { describe, test, expect, afterAll } from '@jest/globals';
import MySQLDBConnection from "../src/implementations/MySQLDBConnection";
import { Person } from './classes/TestEntity';


afterAll(async () =>
{
    await MySQLDBConnection.CloseAllPoolsAsync();
});

describe("SaveChangesAsync and DiscartChangesAsync", () =>
{

    test("Should not add a person", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const personsCount = await contextWithAutoCommit.Persons.CountAsync();

        const newPerson = new Person("newPerson", "person@test.com");
        newPerson.Birth = new Date(1992, 6, 21);
        newPerson.Documents = [5435436, 76576523, 43256778];
        newPerson.LinkTestValueInPerson = 2;
        newPerson.LinkTestArrayInPerson = [1, 2, 3, 4, 5];

        await context.Persons.AddAsync(newPerson);

        const personCountAfterInsert = await contextWithAutoCommit.Persons.CountAsync();
        const personCountAfterInsertInAutoCommitOff = await context.Persons.CountAsync();

        expect(personsCount).toBe(personCountAfterInsert);
        expect(personsCount + 1).toBe(personCountAfterInsertInAutoCommitOff);
        expect(newPerson.Id).toBeGreaterThan(0);

        await context.SaveChangesAsync();

        const personCountAfterInsertAfterCommit = await contextWithAutoCommit.Persons.CountAsync();
        const personCountAfterInsertInAutoCommitOffAfterCommit = await context.Persons.CountAsync();


        expect(personsCount + 1).toBe(personCountAfterInsertAfterCommit);
        expect(personCountAfterInsertAfterCommit).toBe(personCountAfterInsertInAutoCommitOffAfterCommit);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should discard add a person", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const personsCount = await contextWithAutoCommit.Persons.CountAsync();

        const newPerson = new Person("discardedPerson", "discarded@test.com");
        newPerson.Birth = new Date(1992, 6, 21);
        newPerson.Documents = [5435436, 76576523, 43256778];
        newPerson.LinkTestValueInPerson = 2;
        newPerson.LinkTestArrayInPerson = [1, 2, 3, 4, 5];

        await context.Persons.AddAsync(newPerson);

        const personCountAfterInsert = await contextWithAutoCommit.Persons.CountAsync();
        const personCountAfterInsertInAutoCommitOff = await context.Persons.CountAsync();

        expect(personsCount).toBe(personCountAfterInsert);
        expect(personsCount + 1).toBe(personCountAfterInsertInAutoCommitOff);
        expect(newPerson.Id).toBeGreaterThan(0);

        await context.DiscartChangesAsync();

        const personCountAfterDiscard = await contextWithAutoCommit.Persons.CountAsync();
        const personCountAfterDiscardInAutoCommitOff = await context.Persons.CountAsync();

        expect(personsCount).toBe(personCountAfterDiscard);
        expect(personCountAfterDiscard).toBe(personCountAfterDiscardInAutoCommitOff);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should save changes of UpdateAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        let person = await context.Persons.Where({ Field: "Name", Value: "adriano" }).FirstOrDefaultAsync();
        const originalPerson = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(person).not.toBe(undefined);
        expect(originalPerson).not.toBe(undefined);

        person!.Age = 77;
        person!.CEP = 11223344;
        person!.PhoneNumbers = ["+55(11)99999-1111"];

        await context.Persons.UpdateAsync(person!);

        const updatedInAutoCommitOff = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const updatedWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(updatedInAutoCommitOff!.Age).toBe(77);
        expect(updatedInAutoCommitOff!.CEP).toBe(11223344);
        expect(updatedInAutoCommitOff!.PhoneNumbers).toEqual(["+55(11)99999-1111"]);
        expect(updatedWithAutoCommit!.Age).toBe(originalPerson!.Age);
        expect(updatedWithAutoCommit!.CEP).toBe(originalPerson!.CEP);
        expect(updatedWithAutoCommit!.PhoneNumbers).toEqual(originalPerson!.PhoneNumbers);

        await context.SaveChangesAsync();

        const updatedAfterCommit = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const updatedInAutoCommitOffAfterCommit = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(updatedAfterCommit!.Age).toBe(77);
        expect(updatedAfterCommit!.CEP).toBe(11223344);
        expect(updatedAfterCommit!.PhoneNumbers).toEqual(["+55(11)99999-1111"]);
        expect(updatedAfterCommit!.Age).toBe(updatedInAutoCommitOffAfterCommit!.Age);
        expect(updatedAfterCommit!.CEP).toBe(updatedInAutoCommitOffAfterCommit!.CEP);
        expect(updatedAfterCommit!.PhoneNumbers).toEqual(updatedInAutoCommitOffAfterCommit!.PhoneNumbers);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should discard changes of UpdateAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        let person = await context.Persons.Where({ Field: "Name", Value: "adriano" }).FirstOrDefaultAsync();
        const originalPerson = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        person!.Age = 88;
        person!.CEP = 99887766;
        person!.PhoneNumbers = ["+55(11)98888-2222"];

        await context.Persons.UpdateAsync(person!);

        const updatedInAutoCommitOff = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const updatedWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(updatedInAutoCommitOff!.Age).toBe(88);
        expect(updatedInAutoCommitOff!.CEP).toBe(99887766);
        expect(updatedInAutoCommitOff!.PhoneNumbers).toEqual(["+55(11)98888-2222"]);
        expect(updatedWithAutoCommit!.Age).toBe(originalPerson!.Age);
        expect(updatedWithAutoCommit!.CEP).toBe(originalPerson!.CEP);
        expect(updatedWithAutoCommit!.PhoneNumbers).toEqual(originalPerson!.PhoneNumbers);

        await context.DiscartChangesAsync();

        const updatedAfterDiscard = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const updatedInAutoCommitOffAfterDiscard = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(updatedAfterDiscard!.Age).toBe(originalPerson!.Age);
        expect(updatedAfterDiscard!.CEP).toBe(originalPerson!.CEP);
        expect(updatedAfterDiscard!.PhoneNumbers).toEqual(originalPerson!.PhoneNumbers);
        expect(updatedAfterDiscard!.Age).toBe(updatedInAutoCommitOffAfterDiscard!.Age);
        expect(updatedAfterDiscard!.CEP).toBe(updatedInAutoCommitOffAfterDiscard!.CEP);
        expect(updatedAfterDiscard!.PhoneNumbers).toEqual(updatedInAutoCommitOffAfterDiscard!.PhoneNumbers);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should save changes of UpdateSelectionAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const selectedCount = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();

        const rowsAffecteds = await context.Persons
            .Set("Age", 30)
            .Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" })
            .UpdateSelectionAsync();

        const updatedInAutoCommitOff = await context.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();
        const updatedWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();

        expect(rowsAffecteds).toBe(selectedCount);
        expect(updatedInAutoCommitOff.every(s => s.Age == 30)).toBeTruthy();
        expect(updatedWithAutoCommit.every(s => s.Age != 30)).toBeTruthy();

        await context.SaveChangesAsync();

        const updatedAfterCommit = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();
        const updatedInAutoCommitOffAfterCommit = await context.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();

        expect(updatedAfterCommit.every(s => s.Age == 30)).toBeTruthy();
        expect(updatedAfterCommit.length).toBe(updatedInAutoCommitOffAfterCommit.length);
        expect(updatedInAutoCommitOffAfterCommit.every(s => s.Age == 30)).toBeTruthy();

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should discard changes of UpdateSelectionAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const selectedCount = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();
        const originalWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();

        const rowsAffecteds = await context.Persons
            .Set("Age", 31)
            .Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" })
            .UpdateSelectionAsync();

        const updatedInAutoCommitOff = await context.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();
        const updatedWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();

        expect(rowsAffecteds).toBe(selectedCount);
        expect(updatedInAutoCommitOff.every(s => s.Age == 31)).toBeTruthy();
        expect(updatedWithAutoCommit.map(s => s.Age)).toEqual(originalWithAutoCommit.map(s => s.Age));

        await context.DiscartChangesAsync();

        const updatedAfterDiscard = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();
        const updatedInAutoCommitOffAfterDiscard = await context.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).ToListAsync();

        expect(updatedAfterDiscard.map(s => s.Age)).toEqual(originalWithAutoCommit.map(s => s.Age));
        expect(updatedInAutoCommitOffAfterDiscard.map(s => s.Age)).toEqual(originalWithAutoCommit.map(s => s.Age));

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should save changes of DeleteAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const person = await context.Persons.Where({ Field: "Name", Value: "adriano" }).FirstOrDefaultAsync();

        await context.Persons.DeleteAsync(person!);

        const deletedInAutoCommitOff = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const deletedWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(deletedInAutoCommitOff).toBe(undefined);
        expect(deletedWithAutoCommit).not.toBe(undefined);

        await context.SaveChangesAsync();

        const deletedAfterCommit = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const deletedInAutoCommitOffAfterCommit = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(deletedAfterCommit).toBe(undefined);
        expect(deletedInAutoCommitOffAfterCommit).toBe(undefined);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should discard changes of DeleteAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const person = await context.Persons.Where({ Field: "Name", Value: "adriano" }).FirstOrDefaultAsync();

        await context.Persons.DeleteAsync(person!);

        const deletedInAutoCommitOff = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const deletedWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(deletedInAutoCommitOff).toBe(undefined);
        expect(deletedWithAutoCommit).not.toBe(undefined);

        await context.DiscartChangesAsync();

        const deletedAfterDiscard = await contextWithAutoCommit.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();
        const deletedInAutoCommitOffAfterDiscard = await context.Persons.Where({ Field: "Id", Value: person!.Id }).FirstOrDefaultAsync();

        expect(deletedAfterDiscard).not.toBe(undefined);
        expect(deletedInAutoCommitOffAfterDiscard).not.toBe(undefined);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should save changes of DeleteSelectionAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const selectedCount = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();
        const totalCount = await contextWithAutoCommit.Persons.CountAsync();

        const rowsAffecteds = await context.Persons
            .Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" })
            .DeleteSelectionAsync();

        const countInAutoCommitOff = await context.Persons.CountAsync();
        const countWithAutoCommit = await contextWithAutoCommit.Persons.CountAsync();
        const filteredInAutoCommitOff = await context.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();
        const filteredWithAutoCommit = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();

        expect(rowsAffecteds).toBe(selectedCount);
        expect(countInAutoCommitOff).toBe(totalCount - selectedCount);
        expect(countWithAutoCommit).toBe(totalCount);
        expect(filteredInAutoCommitOff).toBe(0);
        expect(filteredWithAutoCommit).toBe(selectedCount);

        await context.SaveChangesAsync();

        const countAfterCommit = await contextWithAutoCommit.Persons.CountAsync();
        const countInAutoCommitOffAfterCommit = await context.Persons.CountAsync();
        const filteredAfterCommit = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();

        expect(countAfterCommit).toBe(totalCount - selectedCount);
        expect(countAfterCommit).toBe(countInAutoCommitOffAfterCommit);
        expect(filteredAfterCommit).toBe(0);

        await TruncatePersonTableAsync();

    }, 500000);

    test("Should discard changes of DeleteSelectionAsync", async () =>
    {
        const context = await CompleteSeedAsync();
        context["_manager"]["_autoCommit"] = false;

        const contextWithAutoCommit = await CreateContext();

        const selectedCount = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();
        const totalCount = await contextWithAutoCommit.Persons.CountAsync();

        const rowsAffecteds = await context.Persons
            .Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" })
            .DeleteSelectionAsync();

        const countInAutoCommitOff = await context.Persons.CountAsync();
        const countWithAutoCommit = await contextWithAutoCommit.Persons.CountAsync();

        expect(rowsAffecteds).toBe(selectedCount);
        expect(countInAutoCommitOff).toBe(totalCount - selectedCount);
        expect(countWithAutoCommit).toBe(totalCount);

        await context.DiscartChangesAsync();

        const countAfterDiscard = await contextWithAutoCommit.Persons.CountAsync();
        const countInAutoCommitOffAfterDiscard = await context.Persons.CountAsync();
        const filteredAfterDiscard = await contextWithAutoCommit.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();
        const filteredInAutoCommitOffAfterDiscard = await context.Persons.Where({ Field: "Name", Kind: Operation.STARTWITH, Value: "a" }).CountAsync();

        expect(countAfterDiscard).toBe(totalCount);
        expect(countAfterDiscard).toBe(countInAutoCommitOffAfterDiscard);
        expect(filteredAfterDiscard).toBe(selectedCount);
        expect(filteredInAutoCommitOffAfterDiscard).toBe(selectedCount);

        await TruncatePersonTableAsync();

    }, 500000);

});
