import { MySQLManager } from "../src/Index";
import InvalidOperationException from "../src/core/exceptions/InvalidOperationException";
import MySQLConnection from "../src/implementations/MySQLConnection";
import Context from "./classes/TestContext";

describe("Connection", ()=>{


    test("Test open and close connection", async ()=>{

        var conn = new MySQLConnection("localhost", 3306, "mydb", "root", "root");

        expect(conn).not.toBe(null);

        await conn.OpenAsync();

        await conn.CloseAsync();
       

    });


    test("Test open and close connection using enviroment variables", async ()=>{

      process.env.DB_HOST = "localhost";      
      process.env.DB_PORT = "3306";
      process.env.DB_USER = "root";
      process.env.DB_PASS = "root";
      process.env.DB_NAME = "mydb";

      let context = new Context(MySQLManager.BuildFromEnviroment());

      let now = await context.ExecuteQuery("select now()");

      expect(now).not.toBeUndefined();

    });

    describe("Should fail", ()=> {

        test("Test open and close connection with no one enviroment variables", async ()=>{

            process.env.DB_HOST = "";      
            process.env.DB_PORT = "";
            process.env.DB_USER = "";
            process.env.DB_PASS = "";
            process.env.DB_NAME = "";              

            try
            {
                let context = new Context(MySQLManager.BuildFromEnviroment());  

                throw new Error("Shouyld have failed");

            }catch(exception)
            {
                if(!(exception instanceof InvalidOperationException))
                {
                    throw new Error("Some unespected error");
                }
            }    
      
          });
      })
    
  

});