import 'reflect-metadata';
import { MySQLDBManager } from "../src/Index";
import InvalidOperationException from "../src/core/exceptions/InvalidOperationException";
import MySQLDBConnection from "../src/implementations/MySQLDBConnection";
import Context from "./classes/TestContext";

describe("Connection", () => {

    test("Should open and close a connection", async () => {

        var conn = new MySQLDBConnection("localhost", 3306, "mysql", "root", "root");

        expect(conn).not.toBe(null);

        await conn.OpenAsync();
        await conn.CloseAsync();

    });


    test("Should open and close a connection using environment variables", async () => {
5
      process.env.DB_HOST = "localhost";      
      process.env.DB_PORT = "3306";
      process.env.DB_USER = "root";
      process.env.DB_PASS = "root";
      process.env.DB_NAME = "mysql";

        let context = new Context(MySQLDBManager.BuildFromEnviroment());

        let now = await context.ExecuteQuery("select now()");

        expect(now).not.toBeUndefined();

    });


    describe("Failure scenarios", () => {

        test("Should fail when no environment variables are provided", async () => {

            process.env.DB_HOST = "";
            process.env.DB_PORT = "";
            process.env.DB_USER = "";
            process.env.DB_PASS = "";
            process.env.DB_NAME = "";

            try {
                new Context(MySQLDBManager.BuildFromEnviroment());
                throw new Error("Expected operation to fail");
            } catch (exception) {
                if (!(exception instanceof InvalidOperationException)) {
                    throw new Error("Unexpected error type");
                }
            }

        });

    });

});
