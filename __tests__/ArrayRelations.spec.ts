
import { Person } from './classes/TestEntity';
import {CreateContext, TruncateTablesAsync} from './functions/TestFunctions';
import { Message } from './classes/RelationEntity';



beforeAll(async()=>{
    await TruncateTablesAsync();
})

describe("Context", ()=>{    

    
    
    test("Testing removing a item from array", async ()=>{
       
        var context = CreateContext();

        let msg = new Message("some message", 
            new Person("Adriano", "adriano@test.com"), 
            [
                new Person("Camila", "camila@test.com"), 
                new Person("Juliana", "juliana@test.com"), 
                new Person("Andre", "andre@test.com")

            ]
            );

        await context.Messages.AddAsync(msg);

        let msgfromDB = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('From')
        .Load('To')            
        .FirstOrDefaultAsync();
       
        expect(msgfromDB).not.toBe(undefined);            
        expect(msgfromDB?.From).not.toBe(undefined);
        expect(msgfromDB?.From?.Name).toBe("Adriano");
        expect(msgfromDB?.To?.length).toBe(3);
        expect(msgfromDB!.To![0].Name).toBe("Camila");
        expect(msgfromDB!.To![1].Name).toBe("Juliana");
        expect(msgfromDB!.To![2].Name).toBe("Andre");
        
        let p = msgfromDB!.To![0];

        let before = await context.Persons.Where({Field : "Id", Value : p.Id}).Load("MessagesReceived").FirstOrDefaultAsync()!;

        expect(before?.MessagesReceived?.length).toBe(1);      

        let index = msgfromDB!.To!.indexOf(p);

        msgfromDB!.To!.splice(index, 1);        

        await context.Messages.UpdateAsync(msgfromDB!);   

        msgfromDB = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('From')
        .Load('To')            
        .FirstOrDefaultAsync();

        let after = await context.Persons.Where({Field : "Id", Value : p.Id}).Load("MessagesReceived").FirstOrDefaultAsync()!;

        expect(after?.MessagesReceived?.length).toBe(0);

        expect(msgfromDB?.To?.length).toBe(2);

    },100000);


    test("Testing removing reference from item", async ()=>{
       
        var context = CreateContext();

        let msg = new Message("some message", 
            new Person("Adriano", "adriano@test.com"), 
            [
                new Person("Camila", "camila@test.com"), 
                new Person("Juliana", "juliana@test.com"), 
                new Person("Andre", "andre@test.com")

            ]
            );

        await context.Messages.AddAsync(msg);

        let msgfromDB = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('From')
        .Load('To')            
        .FirstOrDefaultAsync();
       
        expect(msgfromDB).not.toBe(undefined);            
        expect(msgfromDB?.From).not.toBe(undefined);
        expect(msgfromDB?.From?.Name).toBe("Adriano");
        expect(msgfromDB?.To?.length).toBe(3);
        expect(msgfromDB!.To![0].Name).toBe("Camila");
        expect(msgfromDB!.To![1].Name).toBe("Juliana");
        expect(msgfromDB!.To![2].Name).toBe("Andre");
        
        let p =  await context.Persons.Where({Field : "Id", Value : msgfromDB!.To![0].Id}).Load("MessagesReceived").FirstOrDefaultAsync()!;;

        let before = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('From')
        .Load('To')            
        .FirstOrDefaultAsync();

        expect(before?.To?.length).toBe(3);    
        
        p!.MessagesReceived = [];

        await context.Persons.UpdateAsync(p!);        

        let after = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('From')
        .Load('To')            
        .FirstOrDefaultAsync();

        expect(after?.To?.length).toBe(2); 

        let personAfter = await context.Persons.Where({Field : "Id", Value : p!.Id}).Load("MessagesReceived").FirstOrDefaultAsync()!;

        expect(personAfter?.MessagesReceived?.length).toBe(0);

        expect(after?.To?.length).toBe(2);

    },100000);

    
   
    test("Testing removing reference from objetcs", async ()=>{
       
        var context = CreateContext();

        let msg = new Message("some message", 
            new Person("Adriano", "adriano@test.com"), 
            [
                new Person("Camila", "camila@test.com"), 
                new Person("Juliana", "juliana@test.com"), 
                new Person("Andre", "andre@test.com")

            ]
            );
        msg.User = msg.From;
        await context.Messages.AddAsync(msg);

        let msgfromDB = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('From')
        .Load('To')            
        .FirstOrDefaultAsync();
       
        expect(msgfromDB).not.toBe(undefined);            
        expect(msgfromDB?.From).not.toBe(undefined);
        expect(msgfromDB?.From?.Name).toBe("Adriano");
        expect(msgfromDB?.To?.length).toBe(3);
        expect(msgfromDB!.To![0].Name).toBe("Camila");
        expect(msgfromDB!.To![1].Name).toBe("Juliana");
        expect(msgfromDB!.To![2].Name).toBe("Andre");
        
        let p =  await context.Persons.Where({Field : "Id", Value : msgfromDB!.From!.Id}).Load("Message").Load("MessagesWriten").FirstOrDefaultAsync()!;;

        let before = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('User')              
        .FirstOrDefaultAsync();

        expect(before?.User?.Id).toBe(p?.Id);    
        
        p!.Message = undefined;

        await context.Persons.UpdateAsync(p!);        

        let after = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Load('User')               
        .FirstOrDefaultAsync();

        expect(after?.User).toBeUndefined(); 

        let personAfter = await context.Persons.Where({Field : "Id", Value : p!.Id}).Load("MessagesWriten").Load("Message").FirstOrDefaultAsync()!;

        expect(personAfter?.MessagesWriten?.length).toBe(1);
        expect(personAfter?.Message).toBeUndefined();
        

    },100000);

});