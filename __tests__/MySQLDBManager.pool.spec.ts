import { describe, expect, test } from '@jest/globals';
import MySQLDBConnection from '../src/implementations/MySQLDBConnection';
import MySQLDBManager from '../src/implementations/MySQLDBManager';

class PoolConnectionStub
{
    public IsOpen = false;
    public openCalls = 0;
    public beginCalls = 0;
    public commitCalls = 0;
    public rollbackCalls = 0;
    public closeCalls = 0;
    public failCommit = false;

    public async OpenAsync(): Promise<void>
    {
        this.openCalls++;
        this.IsOpen = true;
    }

    public async BeginTransactionAsync(): Promise<void>
    {
        this.beginCalls++;
    }

    public async CommitAsync(): Promise<void>
    {
        this.commitCalls++;

        if (this.failCommit)
            throw new Error('commit failed');
    }

    public async RollBackAsync(): Promise<void>
    {
        this.rollbackCalls++;
    }

    public async CloseAsync(): Promise<void>
    {
        this.closeCalls++;
        this.IsOpen = false;
    }
}

function CreateManager(connection: PoolConnectionStub): MySQLDBManager
{
    return new MySQLDBManager(connection as unknown as MySQLDBConnection);
}

describe('MySQLDBManager pooled transaction cleanup', () =>
{
    test('releases the connection after every managed transaction', async () =>
    {
        const connection = new PoolConnectionStub();
        const manager = CreateManager(connection);

        for (let index = 0; index < 25; index++)
        {
            await manager.BeginManagedTransactionAsync();
            await manager.CommitAsync();

            expect(manager.InTransactionMode).toBe(false);
            expect(connection.IsOpen).toBe(false);
        }

        expect(connection.openCalls).toBe(25);
        expect(connection.beginCalls).toBe(25);
        expect(connection.commitCalls).toBe(25);
        expect(connection.closeCalls).toBe(25);
    });

    test('releases the connection after a manual transaction rollback', async () =>
    {
        const connection = new PoolConnectionStub();
        const manager = CreateManager(connection);

        await manager.BeginTransactionAsync();
        await manager.RollBackAsync();

        expect(manager.InTransactionMode).toBe(false);
        expect(connection.rollbackCalls).toBe(1);
        expect(connection.closeCalls).toBe(1);
        expect(connection.IsOpen).toBe(false);
    });

    test('keeps the connection checked out after a savepoint rollback until the outer transaction ends', async () =>
    {
        const connection = new PoolConnectionStub();
        const manager = CreateManager(connection);

        await manager.BeginTransactionAsync();
        await manager.RollBackAsync('before_failure');

        expect(manager.InTransactionMode).toBe(true);
        expect(connection.closeCalls).toBe(0);
        expect(connection.IsOpen).toBe(true);

        await manager.CommitAsync();

        expect(manager.InTransactionMode).toBe(false);
        expect(connection.closeCalls).toBe(1);
        expect(connection.IsOpen).toBe(false);
    });

    test('releases the connection and clears transaction state when commit fails', async () =>
    {
        const connection = new PoolConnectionStub();
        connection.failCommit = true;
        const manager = CreateManager(connection);

        await manager.BeginManagedTransactionAsync();

        await expect(manager.CommitAsync()).rejects.toThrow('commit failed');

        expect(manager.InTransactionMode).toBe(false);
        expect(connection.commitCalls).toBe(1);
        expect(connection.closeCalls).toBe(1);
        expect(connection.IsOpen).toBe(false);
    });
});
