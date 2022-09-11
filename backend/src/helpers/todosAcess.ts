import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosTableIndex = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async createTodo(todo : TodoItem) : Promise<TodoItem>{
    logger.info('create todo request', {
      key: todo.todoId,
      data: todo,
      time : new Date().toISOString()
    })
    const params = {
      TableName: this.todosTable,
      Item: todo
    }

    try {
      const data = await this.docClient.put(params).promise();
      logger.info("CreateItem succeeded:", {
        key: todo.todoId,
        data : JSON.stringify(data, null, 2),
        time : new Date().toISOString()
      })
      return todo;
    } catch (err) {
      logger.info("Unable to create item. Error JSON:", {
        key: todo.todoId,
        data : JSON.stringify(err, null, 2),
        time : new Date().toISOString()
      })
    }
  }

  async updateTodo(todo : TodoUpdate, todoId : string, userId : string) : Promise<TodoUpdate>{
    logger.info('update todo request', {
      key: todoId,
      data: todo,
      time : new Date().toISOString()
    })
    const params = {
      TableName: this.todosTable,
      Key: {
        'userId' : userId,
        'todoId' : todoId
      },
      UpdateExpression: 'SET #na = :na, #dd = :dd, #do = :do',
      ExpressionAttributeNames: {
        "#na": "name",
        "#dd": "dueDate",
        "#do": "done"
      },
      ExpressionAttributeValues: {
        ":na" : todo.name,
        ":dd" : todo.dueDate,
        ":do" : todo.done
      }
    }

    try {
      const data = await this.docClient.update(params).promise();
      logger.info("UpdateItem succeeded:", {
        key: todoId,
        data : JSON.stringify(data, null, 2),
        time : new Date().toISOString()
      })
      return todo;
    } catch (err) {
      logger.info("Unable to update item. Error JSON:", {
        key: todoId,
        data : JSON.stringify(err, null, 2),
        time : new Date().toISOString()
      })
    }
  }

  async getAllTodos(userId : String): Promise<TodoItem[]> {
    logger.info('Getting all todos for user', {
      key: userId,
      time : new Date().toISOString()
    })

    const params = {
      KeyConditionExpression: "#userId = :userId",
      ExpressionAttributeNames: {
        "#userId": "userId"
      },
      ExpressionAttributeValues: {
        ":userId": userId
      },
      IndexName: this.todosTableIndex,
      TableName: this.todosTable
    }

    try {
      const data = await this.docClient.query(params).promise();
      logger.info("GetItem succeeded:", {
        key: userId,
        data : JSON.stringify(data, null, 2),
        time : new Date().toISOString()
      })
      const items = data.Items
      return items as TodoItem[]
    } catch (err) {
      logger.info("Unable to read item. Error JSON:", {
        key: userId,
        data : JSON.stringify(err, null, 2),
        time : new Date().toISOString()
      })
    }
  }

  async deleteTodo(todoId : String){

    logger.info('delete todo with id', {
      key: todoId,
      time : new Date().toISOString()
    })

    const params = {
      Key: {
        'KEY_NAME': {N: todoId}
      },
      TableName: this.todosTable
    }

    try {
      const data = await this.docClient.delete(params).promise();
      logger.info("DeleteItem succeeded:", {
        key: todoId,
        data : JSON.stringify(data, null, 2),
        time : new Date().toISOString()
      })
      return data;
    } catch (err) {
      logger.info("Unable to delete item. Error JSON:", {
        key: todoId,
        data : JSON.stringify(err, null, 2),
        time : new Date().toISOString()
      })
    }
  }
}


function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}