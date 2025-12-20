import { MySQLDBManager, MySQLDBContext, MySQLDBSet} from '../../src/Index';
import { Message } from './RelationEntity';
import { Person } from './TestEntity';
import EntityWithNoKey from  './EntityWithNoKey';


export default class Context extends MySQLDBContext
{
    public Persons : MySQLDBSet<Person>;
    public Messages : MySQLDBSet<Message>;
    public ErrorEntity? : MySQLDBSet<EntityWithNoKey>

    constructor(manager : MySQLDBManager)
    {
        super(manager);  
        this.Persons = new MySQLDBSet(Person, this);      
        this.Messages = new MySQLDBSet(Message, this);      
    }
}





