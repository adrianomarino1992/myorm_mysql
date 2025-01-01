import { MySQLManager, MySQLContext, PGDBSet} from '../../src/Index';
import { Message } from './RelationEntity';
import { Person } from './TestEntity';


export default class Context extends MySQLContext
{
    public Persons : PGDBSet<Person>;
    public Messages : PGDBSet<Message>;

    constructor(manager : MySQLManager)
    {
        super(manager);  
        this.Persons = new PGDBSet(Person, this);      
        this.Messages = new PGDBSet(Message, this);      
    }
}