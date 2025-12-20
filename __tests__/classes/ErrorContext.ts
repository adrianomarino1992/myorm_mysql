import {  MySQLDBContext,  MySQLDBSet,  MySQLDBManager } from '../../src/Index';
import EntityWithNoKey from './EntityWithNoKey';


export default class ErrorContext extends MySQLDBContext {

    public ErrorEntity: MySQLDBSet<EntityWithNoKey>;

    constructor(manager: MySQLDBManager) {
        super(manager);

        this.ErrorEntity = new MySQLDBSet(EntityWithNoKey, this);
    }
}
